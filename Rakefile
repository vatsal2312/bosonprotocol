require 'confidante'
require 'rake_fly'

require_relative 'lib/ganache'

configuration = Confidante.configuration

RakeFly.define_installation_tasks(version: '6.7.2')

task :default => [
    :build_fix,
    :test
]

task :build => [
    :"contracts:compile",
    :"contracts:lint",
    :"contracts:format",
    :"tests:lint",
    :"tests:format"
]

task :build_fix => [
    :"contracts:compile",
    :"contracts:lint_fix",
    :"contracts:format_fix",
    :"tests:lint_fix",
    :"tests:format_fix"
]

task :test => [
    :"tests:unit"
]

namespace :ganache do
  desc "Start ganache on provided port, default 8545"
  task :start, [:port] => [:'dependencies:install'] do |_, args|
    args.with_defaults(port: 8545)

    puts "Starting ganache on port #{args.port}..."
    ganache = Ganache.builder
        .on_port(args.port)
        .allowing_unlimited_contract_size
        .build
    ganache.start
    puts "Started ganache on port #{args.port}"
    puts "  - with pidfile at #{ganache.pidfile}"
    puts "  - with account keys file at #{ganache.account_keys_file}"
  end

  desc "Stop ganache on provided port, default 8545"
  task :stop, [:port] => [:'dependencies:install'] do |_, args|
    args.with_defaults(port: 8545)

    puts "Stopping ganache on port #{args.port}..."
    ganache = Ganache.builder
        .on_port(args.port)
        .build
    ganache.stop
    puts "Stopped ganache on port #{args.port}"
  end
end

namespace :dependencies do
  desc "Install all dependencies"
  task :install do
    sh('npm', 'install')
  end
end

namespace :contracts do
  desc "Compile all contracts"
  task :compile => [:'dependencies:install'] do
    sh('npm', 'run', 'contracts:compile')
  end

  desc "Lint all contracts"
  task :lint => [:'dependencies:install'] do
    sh('npm', 'run', 'contracts:lint')
  end

  desc "Lint & fix all contracts"
  task :lint_fix => [:'dependencies:install'] do
    sh('npm', 'run', 'contracts:lint-fix')
  end

  desc "Format all contracts"
  task :format => [:'dependencies:install'] do
    sh('npm', 'run', 'contracts:format')
  end

  desc "Format & fix all contracts"
  task :format_fix => [:'dependencies:install'] do
    sh('npm', 'run', 'contracts:format-fix')
  end
end

namespace :tests do
  desc "Lint all tests"
  task :lint => [:'dependencies:install'] do
    sh('npm', 'run', 'tests:lint')
  end

  desc "Lint & fix all tests"
  task :lint_fix => [:'dependencies:install'] do
    sh('npm', 'run', 'tests:lint-fix')
  end

  desc "Format all test files"
  task :format => [:'dependencies:install'] do
    sh('npm', 'run', 'tests:format')
  end

  desc "Format & fix all test files"
  task :format_fix => [:'dependencies:install'] do
    sh('npm', 'run', 'tests:format-fix')
  end

  desc "Run all contract unit tests"
  task :unit, [:port, :account_keys_file] =>
      [:'dependencies:install'] do |_, args|
    run_unit_tests = lambda do |port, account_keys_file|
      sh({
          "HOST" => "127.0.0.1",
          "PORT" => "#{port}",
          "ACCOUNT_KEYS_FILE" => "#{account_keys_file}"
      }, 'npm', 'run', 'tests:unit')
    end

    if args.port
      puts "Running unit tests against node listening on #{args.port}..."
      run_unit_tests.call(
          args.port,
          args.account_keys_file || 'config/accounts.json')
    else
      puts "Running unit tests against node listening on random available " +
          "port..."
      Ganache.on_available_port(
          allow_unlimited_contract_size: true) do |ganache|
        run_unit_tests.call(ganache.port, ganache.account_keys_file)
      end
    end
  end

  desc "Run test coverage for contract unit tests"
  task :coverage => [:'dependencies:install'] do
    puts "Running test coverage for contract unit tests..."
    sh('npm', 'run', 'tests:coverage')
  end
end

namespace :ci do
  RakeFly.define_authentication_tasks(
      namespace: :authentication,
      argument_names: [
          :ci_deployment_type,
          :ci_deployment_label
      ]) do |t, args|
    configuration = configuration
        .for_scope(args.to_h)

    t.target = configuration.concourse_team
    t.concourse_url = configuration.concourse_url
    t.team = configuration.concourse_team
    t.username = configuration.concourse_username
    t.password = configuration.concourse_password

    t.home_directory = 'build/fly'
  end

  namespace :pipeline do
    RakeFly.define_pipeline_tasks(
        namespace: :master,
        argument_names: [
            :ci_deployment_type,
            :ci_deployment_label]
    ) do |t, args|
      configuration = configuration
          .for_scope(args.to_h.merge(role: 'master-pipeline'))
      ci_deployment_type = configuration.ci_deployment_identifier

      t.target = configuration.concourse_team
      t.team = configuration.concourse_team
      t.pipeline = "contracts-master"

      t.config = 'pipelines/master/pipeline.yaml'

      t.vars = configuration.vars
      t.var_files = [
          'config/secrets/pipeline/constants.yaml',
          "config/secrets/pipeline/#{ci_deployment_type}.yaml"
      ]

      t.non_interactive = true
      t.home_directory = 'build/fly'
    end

    RakeFly.define_pipeline_tasks(
        namespace: :builder,
        argument_names: [
            :ci_deployment_type,
            :ci_deployment_label]
    ) do |t, args|
      configuration = configuration
          .for_scope(args.to_h.merge(role: 'builder-pipeline'))
      ci_deployment_type = configuration.ci_deployment_identifier

      t.target = configuration.concourse_team
      t.team = configuration.concourse_team
      t.pipeline = "contracts-builder"

      t.config = 'pipelines/builder/pipeline.yaml'

      t.vars = configuration.vars
      t.var_files = [
          'config/secrets/pipeline/constants.yaml',
          "config/secrets/pipeline/#{ci_deployment_type}.yaml"
      ]

      t.non_interactive = true
      t.home_directory = 'build/fly'
    end

    namespace :pr do
      RakeFly.define_pipeline_tasks(
          argument_names: [
              :ci_deployment_type,
              :ci_deployment_label,
              :branch
          ]
      ) do |t, args|
        branch = args.branch || pr_metadata_branch

        configuration = configuration
            .for_scope(args.to_h.merge(role: 'pr-pipeline'))
            .for_overrides(source_repository_branch: branch)

        ci_deployment_type = configuration.ci_deployment_identifier

        t.target = configuration.concourse_team
        t.team = configuration.concourse_team
        t.pipeline = "contracts-pr-#{branch}"

        t.config = 'pipelines/pr/pipeline.yaml'

        t.vars = configuration.vars
        t.var_files = [
            'config/secrets/pipeline/constants.yaml',
            "config/secrets/pipeline/#{ci_deployment_type}.yaml"
        ]

        t.non_interactive = true
        t.home_directory = 'build/fly'
      end

      task :handle, [
          :ci_deployment_type,
          :ci_deployment_label,
          :branch,
          :state
      ] do |_, args|
        branch = args.branch || pr_metadata_branch
        state = args.state || pr_metadata_state

        if state == "OPEN"
          Rake::Task[:"ci:pipeline:pr:push"].invoke(
              args.ci_deployment_type,
              args.ci_deployment_label,
              branch)
        else
          Rake::Task[:"ci:pipeline:pr:destroy"].invoke(
              args.ci_deployment_type,
              args.ci_deployment_label,
              branch)
        end
      end
    end
  end

  namespace :pipelines do
    desc "Push all pipelines"
    task :push, [:ci_deployment_type, :ci_deployment_label] do |_, args|
      Rake::Task[:"ci:pipeline:master:push"].invoke(*args)
      Rake::Task[:"ci:pipeline:builder:push"].invoke(*args)
    end
  end
end

def pr_metadata_value(key)
  File.exist?(".git/resource/#{key}") ?
      File.read(".git/resource/#{key}") :
      nil
end

def pr_metadata_branch
  pr_metadata_value("head_name")
end

def pr_metadata_state
  pr_metadata_value("state")
end