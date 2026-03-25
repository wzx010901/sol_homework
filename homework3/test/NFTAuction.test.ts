import { expect } from "chai";
import hre from "hardhat";
import { getAddress, parseEther } from "viem";

describe("NFTAuction Contract", function () {
  const ETH_PRICE = 200000000000n;
  const TOKEN_PRICE = 100000000n;

  async function deployAuctionFixture() {
    const [owner, seller, bidder1, bidder2, feeRecipient] = await hre.viem.getWalletClients();
    const publicClient = await hre.viem.getPublicClient();

    const ethUsdPriceFeed = await hre.viem.deployContract("MockV3Aggregator", [8, ETH_PRICE]);
    const tokenUsdPriceFeed = await hre.viem.deployContract("MockV3Aggregator", [8, TOKEN_PRICE]);

    const priceOracle = await hre.viem.deployContract("PriceOracle", [ethUsdPriceFeed.address]);

    const bidToken = await hre.viem.deployContract("MockERC20", [
      "Bid Token",
      "BID",
      6,
      parseEther("1000000"),
    ]);

    await priceOracle.write.addTokenPriceFeed([bidToken.address, tokenUsdPriceFeed.address]);

    const nft = await hre.viem.deployContract("NFT", [
      "Auction NFT",
      "ANFT",
      "https://api.example.com/metadata/",
    ]);

    const auctionImplementation = await hre.viem.deployContract("NFTAuction");

    const auctionProxy = await hre.viem.deployContract("ERC1967Proxy", [
      auctionImplementation.address,
      "0x",
    ]);

    const auction = await hre.viem.getContractAt("NFTAuction", auctionProxy.address);

    await auction.write.initialize([priceOracle.address, feeRecipient.account.address, 250n]);
    await auction.write.addSupportedBidToken([bidToken.address]);

    await nft.write.mint([seller.account.address, "token-uri-1"]);
    await nft.write.mint([seller.account.address, "token-uri-2"]);

    return {
      auction,
      auctionImplementation,
      auctionProxy,
      nft,
      priceOracle,
      bidToken,
      ethUsdPriceFeed,
      tokenUsdPriceFeed,
      owner,
      seller,
      bidder1,
      bidder2,
      feeRecipient,
      publicClient,
    };
  }

  describe("Initialization", function () {
    it("Should initialize with correct parameters", async function () {
      const { auction, priceOracle, feeRecipient } = await deployAuctionFixture();

      expect(await auction.read.priceOracle()).to.equal(getAddress(priceOracle.address));
      expect(await auction.read.feeRecipient()).to.equal(getAddress(feeRecipient.account.address));
      expect(await auction.read.platformFeePercent()).to.equal(250n);
      expect(await auction.read.auctionCounter()).to.equal(0n);
    });

    it("Should set the correct owner", async function () {
      const { auction, feeRecipient } = await deployAuctionFixture();

      expect(await auction.read.owner()).to.equal(getAddress(feeRecipient.account.address));
    });
  });

  describe("Auction Creation", function () {
    it("Should create a new auction", async function () {
      const { auction, nft, seller, publicClient } = await deployAuctionFixture();

      const sellerNft = await hre.viem.getContractAt("NFT", nft.address, {
        walletClient: seller,
      });
      await sellerNft.write.approve([auction.address, 0n]);

      const sellerAuction = await hre.viem.getContractAt("NFTAuction", auction.address, {
        walletClient: seller,
      });

      const startPrice = 1000000000n;
      const reservePrice = 5000000000n;
      const duration = 86400n;

      const tx = await sellerAuction.write.createAuction([
        nft.address,
        0n,
        startPrice,
        reservePrice,
        500n,
        duration,
      ]);

      await publicClient.waitForTransactionReceipt({ hash: tx });

      const auctionData = await auction.read.auctions([1n]);
      expect(auctionData.seller).to.equal(getAddress(seller.account.address));
      expect(auctionData.nftContract).to.equal(getAddress(nft.address));
      expect(auctionData.tokenId).to.equal(0n);
      expect(auctionData.startPrice).to.equal(startPrice);
      expect(auctionData.reservePrice).to.equal(reservePrice);
    });

    it("Should transfer NFT to auction contract", async function () {
      const { auction, nft, seller } = await deployAuctionFixture();

      const sellerNft = await hre.viem.getContractAt("NFT", nft.address, {
        walletClient: seller,
      });
      await sellerNft.write.approve([auction.address, 0n]);

      const sellerAuction = await hre.viem.getContractAt("NFTAuction", auction.address, {
        walletClient: seller,
      });

      await sellerAuction.write.createAuction([
        nft.address,
        0n,
        1000000000n,
        5000000000n,
        500n,
        86400n,
      ]);

      expect(await nft.read.ownerOf([0n])).to.equal(getAddress(auction.address));
    });
  });

  describe("Bidding with ETH", function () {
    async function createAuctionFixture() {
      const base = await deployAuctionFixture();
      const { auction, nft, seller } = base;

      const sellerNft = await hre.viem.getContractAt("NFT", nft.address, {
        walletClient: seller,
      });
      await sellerNft.write.approve([auction.address, 0n]);

      const sellerAuction = await hre.viem.getContractAt("NFTAuction", auction.address, {
        walletClient: seller,
      });

      await sellerAuction.write.createAuction([
        nft.address,
        0n,
        1000000000n,
        5000000000n,
        500n,
        86400n,
      ]);

      return { ...base, auctionId: 1n };
    }

    it("Should place ETH bid", async function () {
      const { auction, bidder1, auctionId } = await createAuctionFixture();

      const bidder1Auction = await hre.viem.getContractAt("NFTAuction", auction.address, {
        walletClient: bidder1,
      });

      const bidAmount = parseEther("0.1");

      await bidder1Auction.write.placeBidETH([auctionId], {
        value: bidAmount,
      });

      const auctionData = await auction.read.auctions([auctionId]);
      expect(auctionData.highestBidder).to.equal(getAddress(bidder1.account.address));
      expect(auctionData.highestBidAmount).to.equal(bidAmount);
    });

    it("Should not allow bid below start price", async function () {
      const { auction, bidder1, auctionId } = await createAuctionFixture();

      const bidder1Auction = await hre.viem.getContractAt("NFTAuction", auction.address, {
        walletClient: bidder1,
      });

      const bidAmount = parseEther("0.001");

      await expect(
        bidder1Auction.write.placeBidETH([auctionId], {
          value: bidAmount,
        })
      ).to.be.rejectedWith("Bid: below start price");
    });

    it("Should require minimum bid increment", async function () {
      const { auction, bidder1, bidder2, auctionId } = await createAuctionFixture();

      const bidder1Auction = await hre.viem.getContractAt("NFTAuction", auction.address, {
        walletClient: bidder1,
      });

      const bidder2Auction = await hre.viem.getContractAt("NFTAuction", auction.address, {
        walletClient: bidder2,
      });

      await bidder1Auction.write.placeBidETH([auctionId], {
        value: parseEther("0.1"),
      });

      await expect(
        bidder2Auction.write.placeBidETH([auctionId], {
          value: parseEther("0.101"),
        })
      ).to.be.rejectedWith("Bid: below minimum increment");

      await bidder2Auction.write.placeBidETH([auctionId], {
        value: parseEther("0.11"),
      });

      const auctionData = await auction.read.auctions([auctionId]);
      expect(auctionData.highestBidder).to.equal(getAddress(bidder2.account.address));
    });

    it("Should refund previous bidder", async function () {
      const { auction, bidder1, bidder2, auctionId } = await createAuctionFixture();

      const bidder1Auction = await hre.viem.getContractAt("NFTAuction", auction.address, {
        walletClient: bidder1,
      });

      const bidder2Auction = await hre.viem.getContractAt("NFTAuction", auction.address, {
        walletClient: bidder2,
      });

      await bidder1Auction.write.placeBidETH([auctionId], {
        value: parseEther("0.1"),
      });

      await bidder2Auction.write.placeBidETH([auctionId], {
        value: parseEther("0.15"),
      });

      const pendingReturn = await auction.read.pendingReturns([auctionId, bidder1.account.address]);
      expect(pendingReturn).to.equal(parseEther("0.1"));
    });
  });

  describe("Bidding with ERC20", function () {
    async function createAuctionFixture() {
      const base = await deployAuctionFixture();
      const { auction, nft, seller, bidToken, bidder1 } = base;

      const sellerNft = await hre.viem.getContractAt("NFT", nft.address, {
        walletClient: seller,
      });
      await sellerNft.write.approve([auction.address, 0n]);

      const sellerAuction = await hre.viem.getContractAt("NFTAuction", auction.address, {
        walletClient: seller,
      });

      await sellerAuction.write.createAuction([
        nft.address,
        0n,
        1000000000n,
        5000000000n,
        500n,
        86400n,
      ]);

      await bidToken.write.transfer([bidder1.account.address, 100000n * 10n ** 6n]);

      return { ...base, auctionId: 1n };
    }

    it("Should place token bid", async function () {
      const { auction, bidToken, bidder1, auctionId } = await createAuctionFixture();

      const bidder1Token = await hre.viem.getContractAt("MockERC20", bidToken.address, {
        walletClient: bidder1,
      });

      const bidder1Auction = await hre.viem.getContractAt("NFTAuction", auction.address, {
        walletClient: bidder1,
      });

      await bidder1Token.write.approve([auction.address, 100n * 10n ** 6n]);

      await bidder1Auction.write.placeBidToken([auctionId, bidToken.address, 100n * 10n ** 6n]);

      const auctionData = await auction.read.auctions([auctionId]);
      expect(auctionData.highestBidder).to.equal(getAddress(bidder1.account.address));
      expect(auctionData.highestBidAmount).to.equal(100n * 10n ** 6n);
      expect(auctionData.highestBidToken).to.equal(getAddress(bidToken.address));
    });

    it("Should not allow unsupported token", async function () {
      const { auction, bidder1, auctionId } = await createAuctionFixture();

      const bidder1Auction = await hre.viem.getContractAt("NFTAuction", auction.address, {
        walletClient: bidder1,
      });

      const unsupportedToken = await hre.viem.deployContract("MockERC20", [
        "Unsupported",
        "UNS",
        6,
        parseEther("1000000"),
      ]);

      await expect(
        bidder1Auction.write.placeBidToken([auctionId, unsupportedToken.address, 100n * 10n ** 6n])
      ).to.be.rejectedWith("Bid: token not supported");
    });
  });

  describe("Admin Functions", function () {
    it("Should update platform fee", async function () {
      const { auction, feeRecipient } = await deployAuctionFixture();

      const feeRecipientAuction = await hre.viem.getContractAt("NFTAuction", auction.address, {
        walletClient: feeRecipient,
      });

      await feeRecipientAuction.write.setPlatformFeePercent([500n]);

      expect(await auction.read.platformFeePercent()).to.equal(500n);
    });

    it("Should not allow fee above maximum", async function () {
      const { auction, feeRecipient } = await deployAuctionFixture();

      const feeRecipientAuction = await hre.viem.getContractAt("NFTAuction", auction.address, {
        walletClient: feeRecipient,
      });

      await expect(feeRecipientAuction.write.setPlatformFeePercent([1500n])).to.be.rejectedWith(
        "Admin: fee too high"
      );
    });

    it("Should pause and unpause contract", async function () {
      const { auction, feeRecipient } = await deployAuctionFixture();

      const feeRecipientAuction = await hre.viem.getContractAt("NFTAuction", auction.address, {
        walletClient: feeRecipient,
      });

      await feeRecipientAuction.write.pause();
      expect(await auction.read.paused()).to.equal(true);

      await feeRecipientAuction.write.unpause();
      expect(await auction.read.paused()).to.equal(false);
    });

    it("Should not allow non-owner to pause", async function () {
      const { auction, seller } = await deployAuctionFixture();

      const sellerAuction = await hre.viem.getContractAt("NFTAuction", auction.address, {
        walletClient: seller,
      });

      await expect(sellerAuction.write.pause()).to.be.rejectedWith("OwnableUnauthorizedAccount");
    });
  });
});
