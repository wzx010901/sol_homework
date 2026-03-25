// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract BeggingContract {
    // ======== 核心状态变量 ========
    // 合约所有者地址（部署者）
    address public immutable owner;
    // 记录每个捐赠者的累计捐赠金额：捐赠者地址 → 总金额（wei）
    mapping(address => uint256) public donationRecords;
    // 捐赠开始/结束时间（时间戳，单位：秒）
    uint256 public donateStartTime;
    uint256 public donateEndTime;

    // ======== 事件定义 ========
    // 捐赠事件：记录每次捐赠的地址、金额、时间
    event Donation(address indexed donor, uint256 amount, uint256 timestamp);

    // ======== 修饰符 ========
    // 仅所有者可调用
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
    // 仅在捐赠时间段内可调用
    modifier onlyDuringDonationPeriod() {
        uint256 nowTime = block.timestamp;
        require(
            nowTime >= donateStartTime && nowTime <= donateEndTime,
            "Donation is not allowed at this time (out of period)"
        );
        _;
    }

    // ======== 构造函数 ========
    // 部署时指定捐赠时间段（开始时间戳、结束时间戳）
    constructor(uint256 _startTime, uint256 _endTime) {
        owner = msg.sender;
        // 校验时间逻辑：结束时间必须晚于开始时间
        require(_endTime > _startTime, "End time must be after start time");
        donateStartTime = _startTime;
        donateEndTime = _endTime;
    }

    /**
     * 捐赠函数：仅在指定时间段内可捐赠，记录金额并触发事件
     */
    function donate() public payable onlyDuringDonationPeriod {
        // 校验捐赠金额大于0
        require(msg.value > 0, "Donation amount must be greater than 0");
        // 累加捐赠者的累计金额
        donationRecords[msg.sender] += msg.value;
        // 触发捐赠事件（方便链上查询所有捐赠记录）
        emit Donation(msg.sender, msg.value, block.timestamp);
    }

    /**
     * 提取资金函数：仅所有者可提取合约所有资金
     */
    function withdraw() public payable onlyOwner {
        uint256 contractBalance = address(this).balance;
        require(contractBalance > 0, "Contract has no funds to withdraw");
        // 安全转账给所有者
        payable(owner).transfer(contractBalance);
    }

    /**
     *  查询单个地址捐赠金额
     */
    function getDonation(address donor) public view returns (uint256) {
        return donationRecords[donor];
    }

    /**
     * 捐赠排行榜：返回捐赠金额最多的前3个地址及对应金额
     * 返回格式：[地址1, 地址2, 地址3], [金额1, 金额2, 金额3]
     * 若捐赠者不足3个，空缺位置返回空地址+0
     */
    function getTop3Donors() public view returns (address[] memory, uint256[] memory) {
        // 初始化前3名的地址和金额（默认空地址+0）
        address[3] memory topAddresses;
        uint256[3] memory topAmounts;

        // 遍历所有捐赠者（注：Solidity无法直接遍历mapping，需额外记录捐赠者列表）
        // 优化方案：维护一个捐赠者列表，避免遍历所有地址（实际开发推荐）
        // 此处为简化演示，假设我们能获取所有捐赠者地址（实际部署需补充donors列表）
        // 👇 先补充捐赠者列表（关键：Solidity mapping无法直接遍历，需手动记录）
        address[] memory donors = getAllDonors();

        for (uint256 i = 0; i < donors.length; i++) {
            address donor = donors[i];
            uint256 amount = donationRecords[donor];

            // 对比并更新前3名
            if (amount > topAmounts[0]) {
                // 超过第1名，顺位后移
                topAmounts[2] = topAmounts[1];
                topAddresses[2] = topAddresses[1];
                topAmounts[1] = topAmounts[0];
                topAddresses[1] = topAddresses[0];
                topAmounts[0] = amount;
                topAddresses[0] = donor;
            } else if (amount > topAmounts[1]) {
                // 超过第2名，顺位后移
                topAmounts[2] = topAmounts[1];
                topAddresses[2] = topAddresses[1];
                topAmounts[1] = amount;
                topAddresses[1] = donor;
            } else if (amount > topAmounts[2]) {
                // 超过第3名
                topAmounts[2] = amount;
                topAddresses[2] = donor;
            }
        }

        // 转换为动态数组返回（Solidity推荐返回动态数组）
        address[] memory resultAddresses = new address[](3);
        uint256[] memory resultAmounts = new uint256[](3);
        for (uint256 i = 0; i < 3; i++) {
            resultAddresses[i] = topAddresses[i];
            resultAmounts[i] = topAmounts[i];
        }

        return (resultAddresses, resultAmounts);
    }

    /**
     * 获取所有捐赠者列表（解决mapping无法遍历的问题）
     * 注：需在donate函数中同步维护此列表
     */
    address[] public allDonors; // 存储所有捐赠过的地址（去重）
    function getAllDonors() public view returns (address[] memory) {
        return allDonors;
    }

    // 重写donate函数，补充捐赠者列表去重逻辑（完整版本）
    function donateWithDonorRecord() public payable onlyDuringDonationPeriod {
        require(msg.value > 0, "Donation amount must be greater than 0");
        // 累加捐赠金额
        donationRecords[msg.sender] += msg.value;
        // 捐赠者去重：若未在列表中则添加
        bool isExist = false;
        for (uint256 i = 0; i < allDonors.length; i++) {
            if (allDonors[i] == msg.sender) {
                isExist = true;
                break;
            }
        }
        if (!isExist) {
            allDonors.push(msg.sender);
        }
        // 触发事件
        emit Donation(msg.sender, msg.value, block.timestamp);
    }

    /**
     * 辅助：查询合约当前总余额
     */
    function getContractBalance() public view returns (uint256) {
        return address(this).balance;
    }

    /**
     * 辅助：更新捐赠时间段（仅所有者）
     */
    function updateDonationPeriod(uint256 _newStart, uint256 _newEnd) public onlyOwner {
        require(_newEnd > _newStart, "End time must be after start time");
        donateStartTime = _newStart;
        donateEndTime = _newEnd;
    }
}