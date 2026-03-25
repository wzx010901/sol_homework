

## 📋 合约功能说明

### 1️⃣ homework01.sol 

#### 🗳️ Voting（投票系统）
- **功能**：去中心化投票系统
- **核心函数**：
  - `vote(string candidate)` - 给某候选人投票
  - `getVotes(string candidate)` - 查询某候选人得票数
  - `resetVotes()` - 重置所有票数

#### 🔤 ReverseString（字符串反转）
- **功能**：反转输入字符串
- **核心函数**：
  - `reverse(string input)` - 返回反转后的字符串

#### 🔢 IntegerToRoman（整数转罗马数字）
- **功能**：将整数 (1-3999) 转换为罗马数字
- **核心函数**：
  - `intToRoman(uint256 num)` - 返回对应的罗马数字字符串

#### 📈 RomanToInteger（罗马数字转整数）
- **功能**：将罗马数字转换为整数
- **核心函数**：
  - `romanToInt(string roman)` - 返回对应的整数值
- **示例**：`"MCMXCIV" → 1994`

#### 🔄 MergeSortedArrays（合并有序数组）
- **功能**：合并两个升序数组为一个升序数组
- **核心函数**：
  - `merge(uint256[] arr1, uint256[] arr2)` - 返回合并后的有序数组

#### 🔍 BinarySearch（二分查找）
- **功能**：在升序数组中二分查找目标值
- **核心函数**：
  - `binarySearch(uint256[] sortedArr, uint256 target)` - 找到返回索引，未找到返回 -1



### 2️⃣ BeggingContract.sol - 乞讨捐赠合约

#### 💰 BeggingContract（乞讨/捐赠合约）
- **功能**：允许用户在指定时间段内捐赠，所有者可提取资金

- **构造函数参数**：
    - `_startTime` - 捐赠开始时间（时间戳）
    - `_endTime` - 捐赠结束时间（时间戳）

- **核心函数**：
    - `donate()` - 捐赠 ETH（需在时间范围内）
    - `donateWithDonorRecord()` - 捐赠并记录捐赠者列表（推荐使用）
    - `withdraw()` - 所有者提取全部资金
    - `getDonation(address donor)` - 查询某地址的捐赠总额
    - `getTop3Donors()` - 获取捐赠排行榜前 3 名
    - `getContractBalance()` - 查询合约当前余额
    - `updateDonationPeriod(uint256 start, uint256 end)` - 更新捐赠时间段（仅所有者）

- **事件**：
    - `Donation(address donor, uint256 amount, uint256 timestamp)` - 每次捐赠都会触发


