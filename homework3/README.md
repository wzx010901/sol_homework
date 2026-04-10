# NFT 拍卖市场项目

## 项目简介

这是一个基于 Hardhat 框架开发的 NFT 拍卖市场，支持以下功能：

- NFT 合约：使用 ERC721 标准实现，支持铸造和转移
- 拍卖合约：支持创建拍卖、出价（ERC20 或以太坊）、结束拍卖
- Chainlink 预言机：获取 ERC20 和以太坊到美元的价格
- 合约升级：使用 UUPS 代理模式实现

## 项目结构

```
├── contracts/
│   ├── NFT.sol                # NFT 合约
│   ├── PriceOracle.sol        # 价格预言机合约
│   ├── NFTAuction.sol         # 拍卖合约
│   └── mocks/                 # 测试用模拟合约
│       ├── MockV3Aggregator.sol  # 模拟价格预言机
│       └── MockERC20.sol         # 模拟 ERC20 代币
├── ignition/
│   └── modules/
│       └── NFTAuctionDeployment.ts  # 部署脚本
├── test/
│   ├── NFT.test.ts            # NFT 合约测试
│   ├── PriceOracle.test.ts    # 价格预言机测试
│   └── NFTAuction.test.ts     # 拍卖合约测试
├── hardhat.config.ts          # Hardhat 配置
├── package.json               # 项目依赖
└── .env                       # 环境变量
```

## 功能说明

### NFT 合约
- 实现 ERC721 标准
- 支持铸造 NFT
- 支持转移 NFT

### 价格预言机
- 集成 Chainlink 价格预言机
- 获取 ETH 到 USD 的价格
- 获取 ERC20 代币到 USD 的价格
- 提供价格转换功能)

### 拍卖合约
- 创建拍卖：将 NFT 上架拍卖
- 出价：支持 ERC20 或以太坊出价
- 结束拍卖：NFT 转移给出价最高者，资金转移给卖家
- 平台手续费：可配置的平台手续费
- 可暂停：紧急情况下可暂停合约
- 可升级：使用 UUPS 代理模式实现合约升级

## 部署步骤

### 1. 环境准备

```bash
# 安装依赖
npm install

# 配置环境变量
# 编辑 .env 文件，设置以下变量：
# SEPOLIA_RPC_URL - Sepolia 测试网 RPC URL
# SEPOLIA_PRIVATE_KEY - 部署账户私钥
# ETHERSCAN_API_KEY - Etherscan API 密钥
```

### 2. 编译合约

```bash
npx hardhat compile
```

### 3. 运行测试

```bash
npx hardhat test
```

### 4. 部署到 Sepolia 测试网

```bash
npx hardhat ignition deploy ./ignition/modules/NFTAuctionDeployment.ts --network sepolia
```


