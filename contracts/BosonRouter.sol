// SPDX-License-Identifier: LGPL-3.0-or-later
pragma solidity 0.7.1;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "./interfaces/IVoucherKernel.sol";
import "./interfaces/IERC20WithPermit.sol";
import "./interfaces/ITokenRegistry.sol";
import "./interfaces/IBosonRouter.sol";
import "./interfaces/ICashier.sol";
import "./interfaces/IGate.sol";
import "./interfaces/ITokenWrapper.sol";
import "./UsingHelpers.sol";

/**
 * @title Contract for interacting with Boson Protocol from the user's perspective.
 */
contract BosonRouter is
    IBosonRouter,
    UsingHelpers,
    Pausable,
    ReentrancyGuard,
    Ownable
{
    using Address for address payable;
    using SafeMath for uint256;

    address private cashierAddress;
    address private voucherKernel;
    address private tokenRegistry;

    mapping(uint256 => address) private voucherSetToGateContract;

    event LogOrderCreated(
        uint256 indexed _tokenIdSupply,
        address _seller,
        uint256 _quantity,
        uint8 _paymentType
    );

    event LogConditionalOrderCreated(
        uint256 indexed _tokenIdSupply,
        address indexed _gateAddress
    );

    /**
     * @notice Acts as a modifier, but it's cheaper. Checking if a non-zero address is provided, otherwise reverts.
     */
    function notZeroAddress(address tokenAddress) private pure {
        require(tokenAddress != address(0), "0A"); //zero address
    }

    /**
     * @notice Acts as a modifier, but it's cheaper. Replacement of onlyOwner modifier. If the caller is not the owner of the contract, reverts.
     */
    function onlyRouterOwner() internal view {
        require(owner() == _msgSender(), "NO"); //not owner
    }

    /**
     * @notice Acts as a modifier, but it's cheaper. Checks whether provided value corresponds to the limits in the TokenRegistry.
     * @param value the specified value is per voucher set level. E.g. deposit * qty should not be greater or equal to the limit in the TokenRegistry (ETH).
     */
    function notAboveETHLimit(uint256 value) internal view {
        require(
            value <= ITokenRegistry(tokenRegistry).getETHLimit(),
            "AL" // above limit
        );
    }

    /**
     * @notice Acts as a modifier, but it's cheaper. Checks whether provided value corresponds to the limits in the TokenRegistry.
     * @param _tokenAddress the token address which, we are getting the limits for.
     * @param value the specified value is per voucher set level. E.g. deposit * qty should not be greater or equal to the limit in the TokenRegistry (ETH).
     */
    function notAboveTokenLimit(address _tokenAddress, uint256 value)
        internal
        view
    {
        require(
            value <=
                ITokenRegistry(tokenRegistry).getTokenLimit(
                    _tokenAddress
                ),
            "AL" //above limit
        );
    }

    constructor(
        address _voucherKernel,
        address _tokenRegistry,
        address _cashierAddress
    ) {
        notZeroAddress(_voucherKernel);
        notZeroAddress(_tokenRegistry);
        notZeroAddress(_cashierAddress);

        voucherKernel = _voucherKernel;
        tokenRegistry = _tokenRegistry;
        cashierAddress = _cashierAddress;
    }

    /**
     * @notice Pause the Cashier && the Voucher Kernel contracts in case of emergency.
     * All functions related to creating new batch, requestVoucher or withdraw will be paused, hence cannot be executed.
     * There is special function for withdrawing funds if contract is paused.
     */
    function pause() external override {
        onlyRouterOwner();
        _pause();
        IVoucherKernel(voucherKernel).pause();
        ICashier(cashierAddress).pause();
    }

    /**
     * @notice Unpause the Cashier && the Voucher Kernel contracts.
     * All functions related to creating new batch, requestVoucher or withdraw will be unpaused.
     */
    function unpause() external override {
        onlyRouterOwner();
        require(ICashier(cashierAddress).canUnpause(), "UF"); //unpaused forbidden

        _unpause();
        IVoucherKernel(voucherKernel).unpause();
        ICashier(cashierAddress).unpause();
    }

    /**
     * @notice Internal helper thay
     * - creates Token Supply Id
     * - creates payment method
     * - adds escrow ammount
     * - transfers tokens (if needed)
        @param metadata metadata which is required for creation of a voucher
        Metadata array is used as in some scenarios we need several more params, as we need to recover 
        owner address in order to permit the contract to transfer funds on his behalf. 
        Since the params get too many, we end up in situation that the stack is too deep.
        
        uint256 _validFrom = metadata[0];
        uint256 _validTo = metadata[1];
        uint256 _price = metadata[2];
        uint256 _depositSe = metadata[3];
        uint256 _depositBu = metadata[4];
        uint256 _quantity = metadata[5];
     * @param _paymentMethod  might be ETHETH, ETHTKN, TKNETH or TKNTKN
     * @param _tokenPrice     token address which will hold the funds for the price of the voucher
     * @param _tokenDeposits  token address which will hold the funds for the deposits of the voucher
     * @param _tokensSent     tokens sent to cashier contract
     */

    function requestCreateOrder(uint256[] memory metadata,
        uint8 _paymentMethod,
        address _tokenPrice,
        address _tokenDeposits,
        uint256 _tokensSent) internal returns (uint256) {
        uint256 tokenIdSupply = IVoucherKernel(voucherKernel)
            .createTokenSupplyID(
                msg.sender,
                metadata[0],
                metadata[1],
                metadata[2],
                metadata[3],
                metadata[4],
                metadata[5]
            );

        IVoucherKernel(voucherKernel).createPaymentMethod(
            tokenIdSupply,
            _paymentMethod,
            _tokenPrice,
            _tokenDeposits
        );

        //record funds in escrow ...         
        if (_tokenDeposits == address(0)) { 
            ICashier(cashierAddress).addEscrowAmount{value: msg.value}(msg.sender);
        } else {
            IERC20WithPermit(_tokenDeposits).transferFrom(
            msg.sender,
            address(cashierAddress),
            _tokensSent
        );

            ICashier(cashierAddress).addEscrowTokensAmount(
            _tokenDeposits,
            msg.sender,
            _tokensSent
        );

        }

        emit LogOrderCreated(tokenIdSupply, msg.sender, metadata[5], _paymentMethod);
        
        return tokenIdSupply;
        }

    /**
     * @notice Issuer/Seller offers promises as supply tokens and needs to escrow the deposit
        @param metadata metadata which is required for creation of a voucher
        Metadata array is used as in some scenarios we need several more params, as we need to recover 
        owner address in order to permit the contract to transfer funds on his behalf. 
        Since the params get too many, we end up in situation that the stack is too deep.
        
        uint256 _validFrom = metadata[0];
        uint256 _validTo = metadata[1];
        uint256 _price = metadata[2];
        uint256 _depositSe = metadata[3];
        uint256 _depositBu = metadata[4];
        uint256 _quantity = metadata[5];
     */
    function requestCreateOrderETHETH(uint256[] calldata metadata)
        external
        payable
        override
        nonReentrant
        whenNotPaused
    {
        notAboveETHLimit(metadata[2].mul(metadata[5]));
        notAboveETHLimit(metadata[3].mul(metadata[5]));
        notAboveETHLimit(metadata[4].mul(metadata[5]));
        require(metadata[3].mul(metadata[5]) == msg.value, "IF"); //invalid funds

        requestCreateOrder(metadata, ETHETH, address(0), address(0), 0);

    }


    function requestCreateOrderTKNTKNWithPermitInternal(
        address _tokenPriceAddress,
        address _tokenDepositAddress,
        uint256 _tokensSent,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s,
        uint256[] calldata metadata
    ) internal whenNotPaused returns (uint256) {
        notZeroAddress(_tokenPriceAddress);
        notZeroAddress(_tokenDepositAddress);
        notAboveTokenLimit(_tokenPriceAddress, metadata[2].mul(metadata[5]));
        notAboveTokenLimit(_tokenDepositAddress, metadata[3].mul(metadata[5]));
        notAboveTokenLimit(_tokenDepositAddress, metadata[4].mul(metadata[5]));

        require(metadata[3].mul(metadata[5]) == _tokensSent, "IF"); //invalid funds
        //hex"54" FISSION.code(FISSION.Category.Finance, FISSION.Status.InsufficientFunds)

        _permit(
            _tokenDepositAddress,
            msg.sender,
            address(this),
            _tokensSent,
            deadline,
            v,
            r,
            s
        );

        return requestCreateOrder(metadata, TKNTKN, _tokenPriceAddress, _tokenDepositAddress, _tokensSent);
    }

    function requestCreateOrderTKNTKNWithPermit(
        address _tokenPriceAddress,
        address _tokenDepositAddress,
        uint256 _tokensSent,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s,
        uint256[] calldata metadata
    ) external override  {
        requestCreateOrderTKNTKNWithPermitInternal(
            _tokenPriceAddress,
            _tokenDepositAddress,
            _tokensSent,
            deadline,
            v,
            r,
            s,
            metadata
        );

    }

    function requestCreateOrderTKNTKNWithPermitConditional(
        address _tokenPriceAddress,
        address _tokenDepositAddress,
        uint256 _tokensSent,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s,
        uint256[] calldata metadata,
        address _gateAddress,
        uint256 _nftTokenId
    ) external override {
        notZeroAddress(_gateAddress);

        uint256 tokenIdSupply = requestCreateOrderTKNTKNWithPermitInternal(
            _tokenPriceAddress,
            _tokenDepositAddress,
            _tokensSent,
            deadline,
            v,
            r,
            s,
            metadata
        );

        voucherSetToGateContract[tokenIdSupply] = _gateAddress;

        emit LogConditionalOrderCreated(tokenIdSupply, _gateAddress);

        if (_nftTokenId > 0) {
            IGate(_gateAddress).registerVoucherSetId(
                tokenIdSupply,
                _nftTokenId
            );
        }
    }

    function requestCreateOrderETHTKNWithPermit(
        address _tokenDepositAddress,
        uint256 _tokensSent,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s,
        uint256[] calldata metadata
    ) external override whenNotPaused {
        notZeroAddress(_tokenDepositAddress);
        notAboveETHLimit(metadata[2].mul(metadata[5]));
        notAboveTokenLimit(_tokenDepositAddress, metadata[3].mul(metadata[5]));
        notAboveTokenLimit(_tokenDepositAddress, metadata[4].mul(metadata[5]));

        require(metadata[3].mul(metadata[5]) == _tokensSent, "IF"); //invalid funds

        _permit(
            _tokenDepositAddress,
            msg.sender,
            address(this),
            _tokensSent,
            deadline,
            v,
            r,
            s
        );

        requestCreateOrder(metadata, ETHTKN, address(0), _tokenDepositAddress, _tokensSent);
    }

    function requestCreateOrderTKNETH(
        address _tokenPriceAddress,
        uint256[] calldata metadata
    ) external payable override nonReentrant whenNotPaused {
        notZeroAddress(_tokenPriceAddress);
        notAboveTokenLimit(_tokenPriceAddress, metadata[2].mul(metadata[5]));
        notAboveETHLimit(metadata[3].mul(metadata[5]));
        notAboveETHLimit(metadata[4].mul(metadata[5]));

        require(metadata[3].mul(metadata[5]) == msg.value, "IF"); //invalid funds

        requestCreateOrder(metadata, TKNETH, _tokenPriceAddress, address(0), 0);
    }

    /**
     * @notice Consumer requests/buys a voucher by filling an order and receiving a Voucher Token in return
     * @param _tokenIdSupply    ID of the supply token
     * @param _issuer           Address of the issuer of the supply token
     */
    function requestVoucherETHETH(uint256 _tokenIdSupply, address _issuer)
        external
        payable
        override
        nonReentrant
        whenNotPaused
    {
        uint256 weiReceived = msg.value;

        //checks
        (uint256 price, , uint256 depositBu) = IVoucherKernel(voucherKernel)
            .getOrderCosts(_tokenIdSupply);
        require(price.add(depositBu) == weiReceived, "IF"); //invalid funds
        //hex"54" FISSION.code(FISSION.Category.Finance, FISSION.Status.InsufficientFunds)

        IVoucherKernel(voucherKernel).fillOrder(
            _tokenIdSupply,
            _issuer,
            msg.sender,
            ETHETH
        );

        //record funds in escrow ...
        ICashier(cashierAddress).addEscrowAmount{value: msg.value}(msg.sender);
    }

    /**
     * @notice check if _tokenIdSupply mapped to gate contract, 
     * if it does, deactivate (user,_tokenIdSupply) to prevent double spending
     * @param _tokenIdSupply    ID of the supply token
     */
    function deactivateConditionalCommit(uint256 _tokenIdSupply) internal {
        if (voucherSetToGateContract[_tokenIdSupply] != address(0)) {
            IGate gateContract = IGate(
                voucherSetToGateContract[_tokenIdSupply]
            );
            require(gateContract.check(msg.sender, _tokenIdSupply),"NE"); // not eligible
            gateContract.deactivate(msg.sender, _tokenIdSupply);
        }
    }

    function requestVoucherTKNTKNWithPermit(
        uint256 _tokenIdSupply,
        address _issuer,
        uint256 _tokensSent,
        uint256 deadline,
        uint8 vPrice,
        bytes32 rPrice,
        bytes32 sPrice, // tokenPrice
        uint8 vDeposit,
        bytes32 rDeposit,
        bytes32 sDeposit // tokenDeposits
    ) external override nonReentrant whenNotPaused {
        // check if _tokenIdSupply mapped to gate contract
        // if yes, deactivate (user,_tokenIdSupply) to prevent double spending
        deactivateConditionalCommit(_tokenIdSupply);

        (uint256 price, uint256 depositBu) = IVoucherKernel(voucherKernel)
            .getBuyerOrderCosts(_tokenIdSupply);
        require(_tokensSent.sub(depositBu) == price, "IF"); //invalid funds

        address tokenPriceAddress = IVoucherKernel(voucherKernel)
            .getVoucherPriceToken(_tokenIdSupply);
        address tokenDepositAddress = IVoucherKernel(voucherKernel)
            .getVoucherDepositToken(_tokenIdSupply);

        _permit(
                tokenPriceAddress,
                msg.sender,
                address(this),
                price,
                deadline,
                vPrice,
                rPrice,
                sPrice
        );


        _permit(
            tokenDepositAddress,
            msg.sender,
            address(this),
            depositBu,
            deadline,
            vDeposit,
            rDeposit,
            sDeposit
        );


        IVoucherKernel(voucherKernel).fillOrder(
            _tokenIdSupply,
            _issuer,
            msg.sender,
            TKNTKN
        );

        IERC20WithPermit(tokenPriceAddress).transferFrom(
            msg.sender,
            address(cashierAddress),
            price
        );
        IERC20WithPermit(tokenDepositAddress).transferFrom(
            msg.sender,
            address(cashierAddress),
            depositBu
        );

        //record funds in escrowTokens for the Price token...
        ICashier(cashierAddress).addEscrowTokensAmount(
            tokenPriceAddress,
            msg.sender,
            price
        );

        //record funds in escrowTokens for the Deposit token...
        ICashier(cashierAddress).addEscrowTokensAmount(
            tokenDepositAddress,
            msg.sender,
            depositBu
        );
    }

    function requestVoucherTKNTKNSameWithPermit(
        uint256 _tokenIdSupply,
        address _issuer,
        uint256 _tokensSent,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external override nonReentrant whenNotPaused {
        // check if _tokenIdSupply mapped to gate contract
        // if yes, deactivate (user,_tokenIdSupply) to prevent double spending
        deactivateConditionalCommit(_tokenIdSupply); 

        (uint256 price, uint256 depositBu) = IVoucherKernel(voucherKernel)
            .getBuyerOrderCosts(_tokenIdSupply);
        require(_tokensSent.sub(depositBu) == price, "IF"); //invalid funds

        address tokenPriceAddress = IVoucherKernel(voucherKernel)
            .getVoucherPriceToken(_tokenIdSupply);
        address tokenDepositAddress = IVoucherKernel(voucherKernel)
            .getVoucherDepositToken(_tokenIdSupply);

        require(tokenPriceAddress == tokenDepositAddress, "IC"); //invalid caller

        // If tokenPriceAddress && tokenPriceAddress are the same
        // practically it's not of importance to each we are sending the funds
        _permit(
            tokenPriceAddress,
            msg.sender,
            address(this),
            _tokensSent,
            deadline,
            v,
            r,
            s
        );

        IVoucherKernel(voucherKernel).fillOrder(
            _tokenIdSupply,
            _issuer,
            msg.sender,
            TKNTKN
        );

        IERC20WithPermit(tokenPriceAddress).transferFrom(
            msg.sender,
            address(cashierAddress),
            _tokensSent
        );

        //record funds in escrowTokens ...
        ICashier(cashierAddress).addEscrowTokensAmount(
            tokenPriceAddress,
            msg.sender,
            _tokensSent
        );
    }

    function requestVoucherETHTKNWithPermit(
        uint256 _tokenIdSupply,
        address _issuer,
        uint256 _tokensDeposit,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external payable override nonReentrant whenNotPaused {
        (uint256 price, uint256 depositBu) = IVoucherKernel(voucherKernel)
            .getBuyerOrderCosts(_tokenIdSupply);
        require(price == msg.value, "IP"); //invalid price
        //hex"54" FISSION.code(FISSION.Category.Finance, FISSION.Status.InsufficientFunds)
        require(depositBu == _tokensDeposit, "ID"); // invalid deposit
        //hex"54" FISSION.code(FISSION.Category.Finance, FISSION.Status.InsufficientFunds)

        address tokenDepositAddress =
            IVoucherKernel(voucherKernel).getVoucherDepositToken(
                _tokenIdSupply
            );

        _permit(
            tokenDepositAddress,
            msg.sender,
            address(this),
            _tokensDeposit,
            deadline,
            v,
            r,
            s
        );

        IVoucherKernel(voucherKernel).fillOrder(
            _tokenIdSupply,
            _issuer,
            msg.sender,
            ETHTKN
        );

        IERC20WithPermit(tokenDepositAddress).transferFrom(
            msg.sender,
            address(cashierAddress),
            _tokensDeposit
        );

        //record funds in escrowTokens ...
        ICashier(cashierAddress).addEscrowTokensAmount(
            tokenDepositAddress,
            msg.sender,
            _tokensDeposit
        );

        //record funds in escrow ...
        ICashier(cashierAddress).addEscrowAmount{value: msg.value}(msg.sender);
    }

    function requestVoucherTKNETHWithPermit(
        uint256 _tokenIdSupply,
        address _issuer,
        uint256 _tokensPrice,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external payable override nonReentrant whenNotPaused {
        (uint256 price, uint256 depositBu) = IVoucherKernel(voucherKernel)
            .getBuyerOrderCosts(_tokenIdSupply);
        require(price == _tokensPrice, "IP"); //invalid price
        //hex"54" FISSION.code(FISSION.Category.Finance, FISSION.Status.InsufficientFunds)
        require(depositBu == msg.value, "ID"); // invalid deposit
        //hex"54" FISSION.code(FISSION.Category.Finance, FISSION.Status.InsufficientFunds)

        address tokenPriceAddress =
            IVoucherKernel(voucherKernel).getVoucherPriceToken(_tokenIdSupply);

        _permit(
            tokenPriceAddress,
            msg.sender,
            address(this),
            price,
            deadline,
            v,
            r,
            s
        );

        IVoucherKernel(voucherKernel).fillOrder(
            _tokenIdSupply,
            _issuer,
            msg.sender,
            TKNETH
        );

        IERC20WithPermit(tokenPriceAddress).transferFrom(
            msg.sender,
            address(cashierAddress),
            price
        );

        //record funds in escrowTokens ...
        ICashier(cashierAddress).addEscrowTokensAmount(
            tokenPriceAddress,
            msg.sender,
            price
        );

        //record funds in escrow ...
        ICashier(cashierAddress).addEscrowAmount{value: msg.value}(msg.sender);
    }

    /**
     * @notice Seller burns the remaining supply in case it's no longer in exchange and withdrawal of the locked deposits for them are being sent back.
     * @param _tokenIdSupply an ID of a supply token (ERC-1155) which will be burned and deposits will be returned for
     */
    function requestCancelOrFaultVoucherSet(uint256 _tokenIdSupply)
        external
        override
        nonReentrant
        whenNotPaused
    {
        uint256 _burnedSupplyQty = IVoucherKernel(voucherKernel)
            .cancelOrFaultVoucherSet(_tokenIdSupply, msg.sender);
        ICashier(cashierAddress).withdrawDepositsSe(
            _tokenIdSupply,
            _burnedSupplyQty,
            msg.sender
        );
    }

    /**
     * @notice Redemption of the vouchers promise
     * @param _tokenIdVoucher   ID of the voucher
     */
    function redeem(uint256 _tokenIdVoucher) external override {
        IVoucherKernel(voucherKernel).redeem(_tokenIdVoucher, msg.sender);
    }

    /**
     * @notice Refunding a voucher
     * @param _tokenIdVoucher   ID of the voucher
     */
    function refund(uint256 _tokenIdVoucher) external override {
        IVoucherKernel(voucherKernel).refund(_tokenIdVoucher, msg.sender);
    }

    /**
     * @notice Issue a complain for a voucher
     * @param _tokenIdVoucher   ID of the voucher
     */
    function complain(uint256 _tokenIdVoucher) external override {
        IVoucherKernel(voucherKernel).complain(_tokenIdVoucher, msg.sender);
    }

    /**
     * @notice Cancel/Fault transaction by the Seller, admitting to a fault or backing out of the deal
     * @param _tokenIdVoucher   ID of the voucher
     */
    function cancelOrFault(uint256 _tokenIdVoucher) external override {
        IVoucherKernel(voucherKernel).cancelOrFault(
            _tokenIdVoucher,
            msg.sender
        );
    }

    /**
     * @notice Get the address of Cashier contract
     * @return Address of Cashier address
     */
    function getCashierAddress() external view override returns (address) {
        return cashierAddress;
    }

    /**
     * @notice Get the address of Voucher Kernel contract
     * @return Address of Voucher Kernel contract
     */
    function getVoucherKernelAddress()
        external
        view
        override
        returns (address)
    {
        return voucherKernel;
    }

    /**
     * @notice Get the address of Token Registry contract
     * @return Address of Token Registrycontract
     */
    function getTokenRegistryAddress() 
        external 
        view 
        override
        returns (address)
    {
        return tokenRegistry;
    }

    /**
     * @notice Call permit on either a token directly or on a token wrapper
     * @param token Address of the token owner who is approving tokens to be transferred by spender
     * @param owner Address of the token owner who is approving tokens to be transferred by spender
     * @param owner Address of the token owner who is approving tokens to be transferred by spender
     * @param spender Address of the party who is transferring tokens on owner's behalf
     * @param value Number of tokens to be transferred
     * @param deadline Time after which this permission to transfer is no longer valid
     * @param v Part of the owner's signatue
     * @param r Part of the owner's signatue
     * @param s Part of the owner's signatue
     */
    function _permit(
        address token,
        address owner,
        address spender,
        uint256 value,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) internal {
        address tokenWrapper = ITokenRegistry(tokenRegistry).getTokenWrapperAddress(token);
        require(tokenWrapper != address(0), "UNSUPPORTED_TOKEN");

        //The BosonToken contract conforms to this spec, so it will be callable this way
        //if it's address is mapped to itself in the TokenRegistry
        ITokenWrapper(tokenWrapper).permit(
            owner,
            spender,
            value,
            deadline,
            v,
            r,
            s
        );
    }


    /**
     * @notice Get the address gate contract that handles conditional commit of certain voucher set
     * @param _tokenIdSupply    ID of the supply token
     * @return Address of the gate contract or zero address if there is no conditional commit
     */
    function getVoucherSetToGateContract(uint256 _tokenIdSupply)
            external
        view
        override
        returns (address)
    {
        return voucherSetToGateContract[_tokenIdSupply];
    }
}
