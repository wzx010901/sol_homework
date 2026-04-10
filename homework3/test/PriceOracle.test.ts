import { expect } from "chai";
import { network } from "hardhat";
import { getAddress, parseEther } from "viem";
import { describe, it } from "node:test";

describe("PriceOracle 合约", async function () {
  const { viem } = await network.connect();

  async function deployPriceOracleFixture() {
    const [owner, addr1] = await viem.getWalletClients();
    const publicClient = await viem.getPublicClient();

    const ethPriceFeed = await viem.deployContract("MockV3Aggregator", [
      8, // decimals
      200000000000n, // $2000.00 (8 decimals)
    ]);

    const tokenPriceFeed = await viem.deployContract("MockV3Aggregator", [
      8, // decimals
      100000000n, // $1.00 (8 decimals)
    ]);

    const priceOracle = await viem.deployContract("PriceOracle", [
      ethPriceFeed.address,
    ]);

    return {
      viem,
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

      expect(await priceOracle.read.ethUsdPriceFeed()).to.equal(
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

      const [price] = await priceOracle.read.getEthPrice();
      expect(price).to.equal(200000000000n);
    });

    it("Should convert ETH to USD correctly", async function () {
      const { priceOracle } = await deployPriceOracleFixture();

      const ethAmount = parseEther("1"); // 1 ETH
      const usdValue = await priceOracle.read.ethToUsd([ethAmount]);

      expect(usdValue).to.equal(200000000000n); // $2000 (8 decimals)
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

      const mockToken = await viem.deployContract("MockERC20", [
        "Mock Token",
        "MTK",
        18,
        parseEther("1000000"),
      ]);

      const tx = await priceOracle.write.addPriceFeed([
        mockToken.address,
        tokenPriceFeed.address,
      ]);
      await publicClient.waitForTransactionReceipt({ hash: tx });

      expect(
        await priceOracle.read.priceFeeds([mockToken.address])
      ).to.equal(getAddress(tokenPriceFeed.address));
    });

    it("Should convert token to USD correctly", async function () {
      const { priceOracle, tokenPriceFeed, owner, publicClient } =
        await deployPriceOracleFixture();

      const mockToken = await viem.deployContract("MockERC20", [
        "Mock Token",
        "MTK",
        18,
        parseEther("1000000"),
      ]);

      await priceOracle.write.addPriceFeed([
        mockToken.address,
        tokenPriceFeed.address,
      ]);

      const tokenAmount = parseEther("100"); // 100 tokens
      const usdValue = await priceOracle.read.tokenToUsd([
        mockToken.address,
        tokenAmount,
        18,
      ]);

      expect(usdValue).to.equal(10000000000n); // $100 (8 decimals)
    });
  });
});
