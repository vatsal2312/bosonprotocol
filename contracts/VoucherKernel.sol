// SPDX-License-Identifier: LGPL-3.0-or-later

pragma solidity >=0.6.2 <0.7.0;

import "@openzeppelin/contracts/utils/Address.sol";
import "./ERC1155ERC721.sol";
import "./usingHelpers.sol";

//preparing for ERC-1066, ERC-1444, EIP-838

/**
 * @title VoucherKernel contract is controlling the core business logic
 * @dev Notes: 
 *  - Since this is a demo app, it is not yet optimized. 
 *      In the next phase, the bulk raw data will be packed into a single bytes32 field and/or pushed off-chain.
 *  - The usage of block.timestamp is honored since vouchers are defined with day-precision and the demo app is not covering all edge cases.
 *      See: https://ethereum.stackexchange.com/questions/5924/how-do-ethereum-mining-nodes-maintain-a-time-consistent-with-the-network/5931#5931
*/
contract VoucherKernel is usingHelpers {    
    using Address for address;
    //using Counters for Counters.Counter;
    //Counters.Counter private voucherTokenId; //unique IDs for voucher tokens
    
    //AssetRegistry assetRegistry;
    ERC1155ERC721 tokensContract;
        
    //promise for an asset could be reusable, but simplified here for brevitbytes32
    struct Promise {
        bytes32 promiseId;
        string assetTitle;      //the asset that is offered
        address seller;       //the seller who created the promise        
        
        //we simplify the value for the demoapp, otherwise voucher details would be packed in one bytes32 field value
        uint256 validFrom;
        uint256 validTo;
        uint256 price;
        uint256 depositSe;
        uint256 depositBu;

        uint idx;
    }
    
    address public owner;           //contract owner
    address public cashierAddress;  //address of the Cashier contract    
    
    mapping(bytes32 => Promise) public promises;    //promises to deliver goods or services
    bytes32[] public promiseKeys;
    
    mapping(address => uint256) public accountSupply;
    mapping(uint256 => bytes32) public ordersPromise;   //mapping between an order (supply token) and a promise
    
    mapping(uint256 => VoucherStatus) public vouchersStatus;    //recording the vouchers evolution
    mapping(uint256 => address) public voucherIssuers;  //issuers of vouchers
    
    //standard reqs
    mapping (uint256 => mapping(address => uint256)) private balances; //balance of token ids of an account
    mapping (address => mapping(address => bool)) private operatorApprovals; //approval of accounts of an operator
    
    //ID reqs
    mapping (uint256 => uint256) public typeCounters;           //counter for ID of a particular type of NFT
    uint256 public constant MASK_TYPE = uint256(uint128(~0)) << 128;     //the type mask in the upper 128 bits
//1111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000

    uint256 public constant MASK_NF_INDEX = uint128(~0);    //the non-fungible index mask in the lower 128
//0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111    
    
    uint256 public constant TYPE_NF_BIT = 1 << 255; //the first bit represents an NFT type
//1000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000    
    
    uint256 public typeId; //base token type ... 127-bits cover 1.701411835*10^38 types (not differentiating between FTs and NFTs)
    /* Token IDs:
    Fungibles: 0, followed by 127-bit FT type ID, in the upper 128 bits, followed by 0 in lower 128-bits
    <0><uint127: base token id><uint128: 0>
    
    Non-fungible supply tokens: 1, followed by 127-bit NFT type ID, in the upper 128 bits, followed by 0 in lower 128-bits
    <1><uint127: base token id><uint128: 0    
    
    Non-fungible vouchers: 1, followed by 127-bit NFT type ID, in the upper 128 bits, followed by a 1-based index of an NFT token ID.
    <1><uint127: base token id><uint128: index of non-fungible>
    */
    
    uint256 public complainPeriod; //for demo purposes, this is fixed/set by owner
    uint256 public cancelFaultPeriod; //for demo purposes, this is fixed/set by owner
    
    
    event LogPromiseCreated(
        bytes32 indexed _promiseId,
        string indexed _assetTitle,
        address indexed _seller,
        uint256 _validFrom,
        uint256 _validTo,
        uint256 _idx
    );
    
    event LogVoucherRedeemed(
        uint256 _tokenIdVoucher,
        address _holder,
        bytes32 _promiseId
    );
    
    event LogVoucherRefunded(
        uint256 _tokenIdVoucher
    );
    
    event LogVoucherComplain(
        uint256 _tokenIdVoucher
    );
    
    event LogVoucherFaultCancel(
        uint256 _tokenIdVoucher
    );
    
    event LogExpirationTriggered(
        uint256 _tokenIdVoucher,
        address _triggeredBy
    );
    
    event LogFinalizeVoucher(
        uint256 _tokenIdVoucher,
        address _triggeredBy
    );
    
    event LogCashierSet(
        address _newCashier,
        address _triggeredBy
    );
    
    event LogComplainPeriodChanged(
        uint256 _newComplainPeriod,
        address _triggeredBy
    );
    
    event LogCancelFaultPeriodChanged(
        uint256 _newCancelFaultPeriod,
        address _triggeredBy
    );    
    
    event LogFundsReleased(
        uint256 _tokenIdVoucher,
        uint8 _type     //0 .. payment, 1 .. deposits
    );


    modifier onlyOwner() {
        require(msg.sender == owner, "UNAUTHORIZED_O");   //hex"10" FISSION.code(FISSION.Category.Permission, FISSION.Status.Disallowed_Stop)
        _;
    }
    
    modifier onlyFromCashier() {
        require(cashierAddress != address(0), "UNSPECIFIED_CASHIER");  //hex"20" FISSION.code(FISSION.Category.Find, FISSION.Status.NotFound_Unequal_OutOfRange)
        require(msg.sender == cashierAddress, "UNAUTHORIZED_C");   //hex"10" FISSION.code(FISSION.Category.Permission, FISSION.Status.Disallowed_Stop)
        _;
    }
    
    modifier onlyVoucherOwner(uint256 _tokenIdVoucher) {
        //check authorization
        require(tokensContract.ownerOf(_tokenIdVoucher) == msg.sender, "UNAUTHORIZED_V");   //hex"10" FISSION.code(FISSION.Category.Permission, FISSION.Status.Disallowed_Stop)
        _;
    }
    
    constructor(
        address _tokensContract
    )
        public 
    {
        owner = msg.sender;
        tokensContract = ERC1155ERC721(_tokensContract);
        
        complainPeriod = 7 * 1 days;
        cancelFaultPeriod = 7 * 1 days;
    }
    
    
    /**
        * @notice Creating a new promise for goods or services.
        * Can be reused, e.g. for making different batches of these (but not in prototype).
        * @param _seller      seller of the promise
        * @param _assetTitle  Name of the asset
        * @param _validFrom   Start of valid period
        * @param _validTo     End of valid period
        * @param _price       Price (payment amount)
        * @param _depositSe   Seller's deposit
        * @param _depositBu   Buyer's deposit
    */
    function createAssetPromise(
        address _seller, 
        string calldata _assetTitle, 
        uint256 _validFrom,
        uint256 _validTo,
        uint256 _price,
        uint256 _depositSe,
        uint256 _depositBu
    ) 
        external 
        onlyFromCashier
        returns (bytes32)
    {
        
        require(_validFrom <= _validTo, "INVALID_VALIDITY_FROM");    //hex"26" FISSION.code(FISSION.Category.Find, FISSION.Status.Above_Range_Overflow)
        require(_validTo >= block.timestamp, "INVALID_VALIDITY_TO");   //hex"24" FISSION.code(FISSION.Category.Find, FISSION.Status.BelowRange_Underflow)
        
        bytes32 key;
        key = keccak256(abi.encodePacked(_assetTitle, _validFrom, _validTo));
        
        if (promiseKeys.length > 0) {
            require(promiseKeys[promises[key].idx] != key, "PROMISE_ALREADY_EXISTS");
        }
        
        promises[key] = Promise({
            promiseId: key,
            assetTitle: _assetTitle,
            seller: _seller,
            validFrom: _validFrom,
            validTo: _validTo,
            price: _price,
            depositSe: _depositSe,
            depositBu: _depositBu,
            idx: promiseKeys.length
        });
        
        promiseKeys.push(key);
        
        emit LogPromiseCreated(key, _assetTitle, msg.sender, _validFrom, _validTo, //_price, _depositSe, _depositBu, _complainPeriod, _cancelFaultPeriod, 
                promiseKeys.length - 1);
        
        return key;
    }    
    
    
    /**
     * @notice Create an order for offering a certain quantity of an asset
     * This creates a listing in a marketplace, technically as an ERC-1155 non-fungible token with supply.
     * @param _seller     seller of the promise
     * @param _promiseId  ID of a promise (simplified into asset for demo)
     * @param _quantity   Quantity of assets on offer
     */
    function createOrder(address _seller, bytes32 _promiseId, uint256 _quantity)
        external 
        onlyFromCashier
        returns (uint256)
    {
        require(_promiseId != bytes32(0), "UNSPECIFIED_PROMISE");   //hex"20" FISSION.code(FISSION.Category.Find, FISSION.Status.NotFound_Unequal_OutOfRange)
        require(promises[_promiseId].seller == _seller, "UNAUTHORIZED_CO");    //hex"10" FISSION.code(FISSION.Category.Permission, FISSION.Status.Disallowed_Stop)
        require(_quantity > 0, "INVALID_QUANTITY"); //hex"24" FISSION.code(FISSION.Category.Find, FISSION.Status.BelowRange_Underflow)
        
        uint256 tokenIdSupply = generateTokenType(true); //create & assign a new non-fungible type
        tokensContract.mint(_seller, tokenIdSupply, _quantity, "");
        
        ordersPromise[tokenIdSupply] = _promiseId;
        accountSupply[_seller] += _quantity;

        return tokenIdSupply;
    }
    
    
     /**
      * @notice Fill Voucher Order, iff funds paid, then extract & mint NFT to the voucher holder
      * @param _tokenIdSupply   ID of the supply token (ERC-1155)
      * @param _issuer          Address of the token's issuer
      * @param _holder          Address of the recipient of the voucher (ERC-721)
      */
    function fillOrder(uint256 _tokenIdSupply, address _issuer, address _holder)
        external
        onlyFromCashier
        returns (uint256)
    {
        //checks
        checkOrderFillable(_tokenIdSupply, _issuer, _holder);

        //close order
        return extract721(_issuer, _holder, _tokenIdSupply);
    }
    
    
    /**
     * @notice Check order is fillable
     * @dev Will throw if checks don't pass
     * @param _tokenIdSupply  ID of the supply token
      * @param _issuer  Address of the token's issuer
      * @param _holder  Address of the recipient of the voucher (ERC-721)  
     */
     function checkOrderFillable(uint256 _tokenIdSupply, address _issuer, address _holder)
        internal
        view
    {
        require(_tokenIdSupply != 0, "UNSPECIFIED_ID"); //hex"20" FISSION.code(FISSION.Category.Find, FISSION.Status.NotFound_Unequal_OutOfRange)

        if (_holder.isContract()) {
            require(IERC165(_holder).supportsInterface(0x150b7a02), "UNSUPPORTED_ERC721_RECEIVED");    //hex"31"
            //bytes4(keccak256("onERC721Received(address,address,uint256,bytes)"))
        }        
        
        require(_holder != address(0), "UNSPECIFIED_ADDRESS");  //hex"20" FISSION.code(FISSION.Category.Find, FISSION.Status.NotFound_Unequal_OutOfRange)
        require(tokensContract.balanceOf(_issuer, _tokenIdSupply) > 0, "OFFER_EMPTY");  //hex"40" FISSION.code(FISSION.Category.Availability, FISSION.Status.Unavailable)
        
    }
    

    /**
     * @notice Extract a standard non-fungible token ERC-721 from a supply stored in ERC-1155
     * @dev Token ID is derived following the same principles for both ERC-1155 and ERC-721
     * @param _issuer          The address of the token issuer
     * @param _to              The address of the token holder
     * @param _tokenIdSupply   ID of the token type
     * @return                 ID of the voucher token
     */
    function extract721(address _issuer, address _to, uint256 _tokenIdSupply)
        internal
        returns (uint256)
    {
        if (_to.isContract()) {
            require(ERC721TokenReceiver(_to).onERC721Received(_issuer, msg.sender, _tokenIdSupply, "") == ERC721TokenReceiver(_to).onERC721Received.selector, "UNSUPPORTED_ERC721_RECEIVED");  //hex"10" FISSION.code(FISSION.Category.Permission, FISSION.Status.Disallowed_Stop)
            //bytes4(keccak256("onERC721Received(address,address,uint256,bytes)"))
        } 

        tokensContract.burn(_issuer, _tokenIdSupply, 1); // This is hardcoded as 1 on purpose
        accountSupply[_issuer]--;
        
        
        //calculate tokenId
        uint256 voucherTokenId = _tokenIdSupply | ++typeCounters[_tokenIdSupply];
        
        //set status
        vouchersStatus[voucherTokenId].status = setChange(vouchersStatus[voucherTokenId].status, idxCommit);
        vouchersStatus[voucherTokenId].isPaymentReleased = false;
        vouchersStatus[voucherTokenId].isDepositsReleased = false;
        
        //mint voucher NFT as ERC-721
        tokensContract.mint(_to, voucherTokenId);
        voucherIssuers[voucherTokenId] = _issuer;
        
        return voucherTokenId;
    }
    
    
    /**
     * @notice Creating a new token type, serving as the base for tokenID generation for NFTs, and a de facto ID for FTs.
     * @param _isNonFungible   Flag for generating NFT or FT
     * @return _tokenType   Returns a newly generated token type
    */
    function generateTokenType(bool _isNonFungible)
        internal
        returns (uint256 _tokenType)
    {
        typeId++;
        
        if (_isNonFungible) {
            _tokenType = TYPE_NF_BIT | typeId << 128; //upper bit is 1, followed by sequence, leaving lower 128-bits as 0
        } else {
            _tokenType = typeId << 128; //upper bit is not set, followed by sequence, leaving lower 128-bits as 0
        }
        
        //not needed:
        //assert(typeId<max_uint127); //used all available space for types"
        
        return _tokenType;
    }
    
    
    /**
     * @notice Redemption of the vouchers promise
     * @param _tokenIdVoucher   ID of the voucher
     */
    function redeem(uint256 _tokenIdVoucher)
        external
        onlyVoucherOwner(_tokenIdVoucher)
    {
        //check status
        require(isStateCommitted(vouchersStatus[_tokenIdVoucher].status), "ALREADY_PROCESSED"); //hex"48" FISSION.code(FISSION.Category.Availability, FISSION.Status.AlreadyDone)
        
        //check validity period
        isInValidityPeriod(_tokenIdVoucher);
        Promise memory tPromise = promises[getPromiseIdFromVoucherId(_tokenIdVoucher)];
        
        //check collection code and/or assign collector
        
        vouchersStatus[_tokenIdVoucher].complainPeriodStart = block.timestamp;
        vouchersStatus[_tokenIdVoucher].status = setChange(vouchersStatus[_tokenIdVoucher].status, idxRedeem);
        
        emit LogVoucherRedeemed(_tokenIdVoucher, msg.sender, tPromise.promiseId);
    }
    
    
    // // // // // // // //
    // UNHAPPY PATH
    // // // // // // // //  
    
    /**
     * @notice Refunding a voucher
     * @param _tokenIdVoucher   ID of the voucher
     */
    function refund(uint256 _tokenIdVoucher)
        external
        onlyVoucherOwner(_tokenIdVoucher)
    {
        require(isStateCommitted(vouchersStatus[_tokenIdVoucher].status), "INAPPLICABLE_STATUS");  //hex"18" FISSION.code(FISSION.Category.Permission, FISSION.Status.NotApplicatableToCurrentState)
        
        //check validity period
        isInValidityPeriod(_tokenIdVoucher);
        
        vouchersStatus[_tokenIdVoucher].complainPeriodStart = block.timestamp;
        vouchersStatus[_tokenIdVoucher].status = setChange(vouchersStatus[_tokenIdVoucher].status, idxRefund);
        
        emit LogVoucherRefunded(_tokenIdVoucher);
    }
    
    
    /**
     * @notice Issue a complain for a voucher
     * @param _tokenIdVoucher   ID of the voucher
     */
    function complain(uint256 _tokenIdVoucher)
        external
        onlyVoucherOwner(_tokenIdVoucher)
    {
        require(!isStatus(vouchersStatus[_tokenIdVoucher].status, idxComplain), "ALREADY_COMPLAINED"); //hex"48" FISSION.code(FISSION.Category.Availability, FISSION.Status.AlreadyDone)
        require(!isStatus(vouchersStatus[_tokenIdVoucher].status, idxFinal), "ALREADY_FINALIZED"); //hex"48" FISSION.code(FISSION.Category.Availability, FISSION.Status.AlreadyDone)
        
        //check if still in the complain period
        Promise memory tPromise = promises[getPromiseIdFromVoucherId(_tokenIdVoucher)];
        
        //if redeeemed or refunded
        if (isStateRedemptionSigned(vouchersStatus[_tokenIdVoucher].status) ||
                    isStateRefunded(vouchersStatus[_tokenIdVoucher].status)) {
            if (!isStatus(vouchersStatus[_tokenIdVoucher].status, idxCancelFault)) {
                require(block.timestamp <= vouchersStatus[_tokenIdVoucher].complainPeriodStart + complainPeriod + cancelFaultPeriod, "COMPLAINPERIOD_EXPIRED"); //hex"46" FISSION.code(FISSION.Category.Availability, FISSION.Status.Expired)
            } else {
                require(block.timestamp <= vouchersStatus[_tokenIdVoucher].complainPeriodStart + complainPeriod, "COMPLAINPERIOD_EXPIRED"); //hex"46" FISSION.code(FISSION.Category.Availability, FISSION.Status.Expired)
            }
            
            vouchersStatus[_tokenIdVoucher].cancelFaultPeriodStart = block.timestamp;
            vouchersStatus[_tokenIdVoucher].status = setChange(vouchersStatus[_tokenIdVoucher].status, idxComplain);
            
            emit LogVoucherComplain(_tokenIdVoucher);
            
        //if expired
        } else if (isStateExpired(vouchersStatus[_tokenIdVoucher].status)) {
            if (!isStatus(vouchersStatus[_tokenIdVoucher].status, idxCancelFault)) {
                require(block.timestamp <= tPromise.validTo + complainPeriod + cancelFaultPeriod, "COMPLAINPERIOD_EXPIRED"); //hex"46" FISSION.code(FISSION.Category.Availability, FISSION.Status.Expired)
            } else {
                require(block.timestamp <= tPromise.validTo + complainPeriod, "COMPLAINPERIOD_EXPIRED"); //hex"46" FISSION.code(FISSION.Category.Availability, FISSION.Status.Expired)
            }
            
            vouchersStatus[_tokenIdVoucher].cancelFaultPeriodStart = block.timestamp;
            vouchersStatus[_tokenIdVoucher].status = setChange(vouchersStatus[_tokenIdVoucher].status, idxComplain);
            
            emit LogVoucherComplain(_tokenIdVoucher);
        
        //if cancelOrFault
        } else if (isStatus(vouchersStatus[_tokenIdVoucher].status, idxCancelFault)) {
            require(block.timestamp <= vouchersStatus[_tokenIdVoucher].complainPeriodStart + complainPeriod, "COMPLAINPERIOD_EXPIRED"); //hex"46" FISSION.code(FISSION.Category.Availability, FISSION.Status.Expired));
            
            vouchersStatus[_tokenIdVoucher].status = setChange(vouchersStatus[_tokenIdVoucher].status, idxComplain);
            
            emit LogVoucherComplain(_tokenIdVoucher);
            
        } else {
            revert("INAPPLICABLE_STATUS");  //hex"18" FISSION.code(FISSION.Category.Permission, FISSION.Status.NotApplicatableToCurrentState)
        }
        
    }
    
     
    /**
     * @notice Cancel/Fault transaction by the Seller, admitting to a fault or backing out of the deal
     * @param _tokenIdVoucher   ID of the voucher
     */
    function cancelOrFault(uint256 _tokenIdVoucher)
        external
    {
        require(getVoucherIssuer(_tokenIdVoucher) == msg.sender,"UNAUTHORIZED_COF");   //hex"10" FISSION.code(FISSION.Category.Permission, FISSION.Status.Disallowed_Stop)
        
        uint8 tStatus = vouchersStatus[_tokenIdVoucher].status;
        
        require(!isStatus(tStatus, idxCancelFault), "ALREADY_CANCELFAULT"); //hex"48" FISSION.code(FISSION.Category.Availability, FISSION.Status.AlreadyDone)
        require(!isStatus(tStatus, idxFinal), "ALREADY_FINALIZED"); //hex"48" FISSION.code(FISSION.Category.Availability, FISSION.Status.AlreadyDone)
        
        Promise memory tPromise = promises[getPromiseIdFromVoucherId(_tokenIdVoucher)];
        
        if (isStatus(tStatus, idxRedeem) || isStatus(tStatus, idxRefund)) {
            //if redeeemed or refunded
            if (!isStatus(tStatus, idxComplain)) {
                require(block.timestamp <= vouchersStatus[_tokenIdVoucher].complainPeriodStart + complainPeriod + cancelFaultPeriod, "COFPERIOD_EXPIRED"); //hex"46" FISSION.code(FISSION.Category.Availability, FISSION.Status.Expired)            
                vouchersStatus[_tokenIdVoucher].complainPeriodStart = block.timestamp;  //resetting the complain period

            } else {
                require(block.timestamp <= vouchersStatus[_tokenIdVoucher].cancelFaultPeriodStart + cancelFaultPeriod, "COFPERIOD_EXPIRED"); //hex"46" FISSION.code(FISSION.Category.Availability, FISSION.Status.Expired)            
            }
            
        } else if (isStatus(tStatus, idxExpire)) {
            //if expired
            if (!isStatus(tStatus, idxComplain)) {
                require(block.timestamp <= tPromise.validTo + complainPeriod + cancelFaultPeriod, "COFPERIOD_EXPIRED"); //hex"46" FISSION.code(FISSION.Category.Availability, FISSION.Status.Expired)            
            } else {
                require(block.timestamp <= vouchersStatus[_tokenIdVoucher].cancelFaultPeriodStart + cancelFaultPeriod, "COFPERIOD_EXPIRED"); //hex"46" FISSION.code(FISSION.Category.Availability, FISSION.Status.Expired)            
            }
            
        } else if (isStateCommitted(tStatus)) {
            //if committed only
            require(block.timestamp <= tPromise.validTo + complainPeriod + cancelFaultPeriod, "COFPERIOD_EXPIRED"); //hex"46" FISSION.code(FISSION.Category.Availability, FISSION.Status.Expired)       
            
        } else {
            revert("INAPPLICABLE_STATUS");  //hex"18" FISSION.code(FISSION.Category.Permission, FISSION.Status.NotApplicatableToCurrentState)
        }
    
        vouchersStatus[_tokenIdVoucher].status = setChange(tStatus, idxCancelFault);
        
        emit LogVoucherFaultCancel(_tokenIdVoucher);
        
    }    
    
    
    // // // // // // // //
    // BACK-END PROCESS
    // // // // // // // //      
    
    
    /**
     * @notice Mark voucher token that the payment was released
     * @param _tokenIdVoucher   ID of the voucher token
     */
    function setPaymentReleased(uint256 _tokenIdVoucher)
        external
        onlyFromCashier
    {
        require(_tokenIdVoucher != 0, "UNSPECIFIED_ID");  //hex"20" FISSION.code(FISSION.Category.Find, FISSION.Status.NotFound_Unequal_OutOfRange)
        vouchersStatus[_tokenIdVoucher].isPaymentReleased = true;
        
        emit LogFundsReleased(_tokenIdVoucher, 0);
    }
    

    /**
     * @notice Mark voucher token that the deposits were released
     * @param _tokenIdVoucher   ID of the voucher token
     */
    function setDepositsReleased(uint256 _tokenIdVoucher)
        external
        onlyFromCashier
    {
        require(_tokenIdVoucher != 0, "UNSPECIFIED_ID");  //hex"20" FISSION.code(FISSION.Category.Find, FISSION.Status.NotFound_Unequal_OutOfRange)
        vouchersStatus[_tokenIdVoucher].isDepositsReleased = true;
        
        emit LogFundsReleased(_tokenIdVoucher, 1);
    }    
    
    
    /**
     * @notice Mark voucher token as expired
     * @param _tokenIdVoucher   ID of the voucher token
     */
     //TODO: refactor to support array of inputs
    function triggerExpiration(uint256 _tokenIdVoucher)
        external
    {
        require(_tokenIdVoucher != 0, "UNSPECIFIED_ID");  //hex"20" FISSION.code(FISSION.Category.Find, FISSION.Status.NotFound_Unequal_OutOfRange)
        
        Promise memory tPromise = promises[getPromiseIdFromVoucherId(_tokenIdVoucher)];
        
        if (tPromise.validTo < block.timestamp &&
            isStateCommitted(vouchersStatus[_tokenIdVoucher].status)
            ) {
                vouchersStatus[_tokenIdVoucher].status = setChange(vouchersStatus[_tokenIdVoucher].status, idxExpire);
                
                emit LogExpirationTriggered(_tokenIdVoucher, msg.sender);
        }  
    }
    

    /**
     * @notice Mark voucher token to the final status
     * @param _tokenIdVoucher   ID of the voucher token
     */
    //TODO: refactor to support array of inputs
    function triggerFinalizeVoucher(uint256 _tokenIdVoucher)
        external
    {
        require(_tokenIdVoucher != 0, "UNSPECIFIED_ID");  //hex"20" FISSION.code(FISSION.Category.Find, FISSION.Status.NotFound_Unequal_OutOfRange)
        
        uint8 tStatus = vouchersStatus[_tokenIdVoucher].status;
        
        require(!isStatus(tStatus, idxFinal), "ALREADY_FINALIZED"); //hex"48" FISSION.code(FISSION.Category.Availability, FISSION.Status.AlreadyDone)
        
        
        bool mark;
        Promise memory tPromise = promises[getPromiseIdFromVoucherId(_tokenIdVoucher)];
        
        if (isStatus(tStatus, idxComplain)) {
            if (isStatus(tStatus, idxCancelFault)) {
                //if COMPLAIN && COF: then final
                mark = true;
                
            } else if (block.timestamp >= vouchersStatus[_tokenIdVoucher].complainPeriodStart + cancelFaultPeriod) {
                //if COMPLAIN: then final after cof period
                mark = true;
            }
            
        } else if (isStatus(tStatus, idxCancelFault) &&
                    block.timestamp >= vouchersStatus[_tokenIdVoucher].complainPeriodStart + complainPeriod
                    ) {
            //if COF: then final after complain period
            mark = true;
            
        } else if (isStateRedemptionSigned(tStatus) ||
                    isStateRefunded(tStatus)) {
            //if RDM/RFND NON_COMPLAIN: then final after complainPeriodStart + complainPeriod
            if (block.timestamp >= vouchersStatus[_tokenIdVoucher].complainPeriodStart + complainPeriod) {
                mark = true;
            }
            
        } else if (isStateExpired(tStatus)) {
            //if EXP NON_COMPLAIN: then final after validTo + complainPeriod
            if (block.timestamp >= tPromise.validTo + complainPeriod) {
                mark = true;
            }             
        }
        
        if (mark) {
            vouchersStatus[_tokenIdVoucher].status = setChange(tStatus, idxFinal);
            emit LogFinalizeVoucher(_tokenIdVoucher, msg.sender);            
        }
        //
    }    
    
    
    // // // // // // // //
    // UTILS 
    // // // // // // // //  
    
    /**
     * @notice Set the address of the Cashier contract
     * @param _cashierAddress   The address of the Cashier contract
     */
    function setCashierAddress(address _cashierAddress)
        external
        onlyOwner
    {
        require(_cashierAddress != address(0), "UNSPECIFIED_ADDRESS");  //hex"20" FISSION.code(FISSION.Category.Find, FISSION.Status.NotFound_Unequal_OutOfRange)
        
        cashierAddress = _cashierAddress;
        
        emit LogCashierSet(_cashierAddress, msg.sender);
    }
    
    
    /**
     * @notice Set the general complain period, should be used sparingly as it has significant consequences. Here done simply for demo purposes.
     * @param _complainPeriod   the new value for complain period (in number of seconds)
     */
    function setComplainPeriod(uint256 _complainPeriod)
        external
        onlyOwner
    {
        complainPeriod = _complainPeriod;
        
        emit LogComplainPeriodChanged(_complainPeriod, msg.sender);
    }
    
    
    /**
     * @notice Set the general cancelOrFault period, should be used sparingly as it has significant consequences. Here done simply for demo purposes.
     * @param _cancelFaultPeriod   the new value for cancelOrFault period (in number of seconds)
     */
    function setCancelFaultPeriod(uint256 _cancelFaultPeriod)
        external
        onlyOwner
    {
        cancelFaultPeriod = _cancelFaultPeriod;
        
        emit LogCancelFaultPeriodChanged(_cancelFaultPeriod, msg.sender);
    }    
    
    
    // // // // // // // //
    // GETTERS 
    // // // // // // // //  
    
    /**
     * @notice Get the promise ID at specific index
     * @param _idx  Index in the array of promise keys
     * @return      Promise ID
     */
    function getPromiseKey(uint256 _idx)
        public view
        returns (bytes32)
    {
        return promiseKeys[_idx];
    }
    
    
    /**
     * @notice Get the supply token ID from a voucher token
     * @param _tokenIdVoucher   ID of the voucher token
     * @return                  ID of the supply token
     */
    function getIdSupplyFromVoucher(uint256 _tokenIdVoucher)
        public pure
        returns (uint256)
    {
        return _tokenIdVoucher & MASK_TYPE;
    }
    
    
    /**
     * @notice Get the promise ID from a voucher token
     * @param _tokenIdVoucher   ID of the voucher token
     * @return                  ID of the promise
     */
    function getPromiseIdFromVoucherId(uint256 _tokenIdVoucher)
        public view
        returns (bytes32)
    {
        require(_tokenIdVoucher != 0, "UNSPECIFIED_ID");  //hex"20" FISSION.code(FISSION.Category.Find, FISSION.Status.NotFound_Unequal_OutOfRange)
        
        uint256 tokenIdSupply = getIdSupplyFromVoucher(_tokenIdVoucher);
        return promises[ordersPromise[tokenIdSupply]].promiseId;
    }
    
    
    /**
     * @notice Get the current supply of tokens of an account
     * @param _account  Address to query
     * @return         Balance
     */
    //TODO: might not need it
    function getTotalSupply(address _account)
        public view
        returns (uint256)
    {
        return accountSupply[_account];
    }
    
    
    /**
     * @notice Get the seller's deposit for a promise
     * @param _promiseId    ID of the promise
     * @return              Deposit of the seller
     */
    function getPromiseDepositSe(bytes32 _promiseId)
        public view
        returns (uint256)
    {
        return (promises[_promiseId].depositSe);
    }
    

    /**
     * @notice Get all necessary funds for a supply token
     * @param _tokenIdSupply   ID of the supply token
     * @return                  returns a tupple (Payment amount, Seller's deposit, Buyer's deposit)
     */
    function getOrderCosts(uint256 _tokenIdSupply)
        public view
        returns (uint256, uint256, uint256)
    {
        bytes32 promiseKey = ordersPromise[_tokenIdSupply];
        return (promises[promiseKey].price, promises[promiseKey].depositSe, promises[promiseKey].depositBu);
    }
    
    
    /**
     * @notice Get the current status of a voucher
     * @param _tokenIdVoucher   ID of the voucher token
     * @return                  Status of the voucher (via enum)
     */
    function getVoucherStatus(uint256 _tokenIdVoucher)
        public view
        returns (uint8, bool, bool)
    {
        return (vouchersStatus[_tokenIdVoucher].status, vouchersStatus[_tokenIdVoucher].isPaymentReleased, vouchersStatus[_tokenIdVoucher].isDepositsReleased);
    }
    
    
    /**
     * @notice Get the issuer of a voucher
     * @param _tokenIdVoucher   ID of the voucher token
     * @return                  Address of the issuer
     */
    function getVoucherIssuer(uint256 _tokenIdVoucher)
        public view
        returns (address)
    {
        return voucherIssuers[_tokenIdVoucher];
    }
    
    
    /**
     * @notice Get the holder of a voucher
     * @param _tokenIdVoucher   ID of the voucher token
     * @return                  Address of the holder
     */
    function getVoucherHolder(uint256 _tokenIdVoucher)
        public view
        returns (address)
    {
        return tokensContract.ownerOf(_tokenIdVoucher);
    }
    
    
    /** 
     * 
     */
     function isInValidityPeriod(uint256 _tokenIdVoucher)
        public view
        returns (bool)
     {
        //check validity period
        Promise memory tPromise = promises[getPromiseIdFromVoucherId(_tokenIdVoucher)];
        require(tPromise.validFrom <= block.timestamp, "INVALID_VALIDITY_FROM"); //hex"26" FISSION.code(FISSION.Category.Find, FISSION.Status.Above_Range_Overflow)
        require(tPromise.validTo >= block.timestamp, "INVALID_VALIDITY_TO");    //hex"24" FISSION.code(FISSION.Category.Find, FISSION.Status.BelowRange_Underflow)         
        
        return true;
     }
    
   
}