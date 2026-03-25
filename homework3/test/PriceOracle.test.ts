import { expect } from "chai";
import hre from "hardhat";
import { getAddress, parseEther } from "viem";

describe("PriceOracle Contract", function () {
  async function deployPriceOracleFixture() {
    const [owner, addr1] = await hre.viem.getWalletClients();
    const publicClient = await hre.viem.getPublicClient();

    const ethPriceFeed = await hre.viem.deployContract("MockV3Aggregator", [
      8, // decimals
      200000000000n, // $2000.00 (8 decimals)
    ]);

    const tokenPriceFeed = await hre.viem.deployContract("MockV3Aggregator", [
      8, // decimals
      100000000n, // $1.00 (8 decimals)
    ]);

    const priceOracle = await hre.viem.deployContract("PriceOracle", [
      ethPriceFeed.address,
    ]);

    return {
      priceOracle,
      ethPriceFeed,
      tokenPriceFeed,
      owner,
      addr1,
      publicClient,
    };
  }

  describe("Deployment", function () {
    it("Should set the correct ETH price feed", async function () {
      const { priceOracle, ethPriceFeed } = await deployPriceOracleFixture();

      expect(await priceOracle.read.ethPriceFeed()).to.equal(
        getAddress(ethPriceFeed.address)
      );
    });

    it("Should set the correct owner", async function () {
      const { priceOracle, owner } = await deployPriceOracleFixture();

      expect(await priceOracle.read.owner()).to.equal(
        getAddress(owner.account.address)
      );
    });
  });

  describe("ETH Price", function () {
    it("Should return correct ETH price in USD", async function () {
      const { priceOracle } = await deployPriceOracleFixture();

      const ethPrice = await priceOracle.read.getLatestEthPrice();
      expect(ethPrice).to.equal(200000000000n);
    });

    it("Should convert ETH to USD correctly", async function () {
      const { priceOracle } = await deployPriceOracleFixture();

      const ethAmount = parseEther("1"); // 1 ETH
      const usdValue = await priceOracle.read.ethToUsd([ethAmount]);

      expect(usdValue).to.equal(2000000000000000000000n); // $2000
    });

    it("Should convert USD to ETH correctly", async function () {
      const { priceOracle } = await deployPriceOracleFixture();

      const usdAmount = 200000000000n; // $2000 (8 decimals)
      const ethValue = await priceOracle.read.usdToEth([usdAmount]);

      expect(ethValue).to.equal(parseEther("1")); // 1 ETH
    });
  });

  describe("Token Price Feeds", function () {
    it("Should allow owner to add token price feed", async function () {
      const { priceOracle, tokenPriceFeed, owner, publicClient } =
        await deployPriceOracleFixture();

      const mockToken = await hre.viem.deployContract("MockERC20", [
        "Mock Token",
        "MTK",
        18,
      ]);

      const tx = await priceOracle.write.addTokenPriceFeed([
        mockToken.address,
        tokenPriceFeed.address,
      ]);
      await publicClient.waitForTransactionReceipt({ hash: tx });

      expect(
        await priceOracle.read.tokenPriceFeeds([mockToken.address])
      ).to.equal(getAddress(tokenPriceFeed.address));
    });

    it("Should convert token to USD correctly", async function () {
      const { priceOracle, tokenPriceFeed, owner, publicClient } =
        await deployPriceOracleFixture();

      const mockToken = await hre.viem.deployContract("MockERC20", [
        "Mock Token",
        "MTK",
        18,
      ]);

      await priceOracle.write.addTokenPriceFeed([
        mockToken.address,
        tokenPriceFeed.address,
      ]);

      const tokenAmount = parseEther("100"); // 100 tokens
      const usdValue = await priceOracle.read.tokenToUsd([
        mockToken.address,
        tokenAmount,
        18,
      ]);

      expect(usdValue).to.equal(100000000000000000000n); // $100 (8 decimals)
    });
  });
});
