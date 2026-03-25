// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

//创建一个名为 Voting 的合约，
contract Voting {
    //一个 mapping 来存储候选人的得票数
    mapping(string => uint256) votes;
    // 存储所有候选人
    string[]  public candidates;

    //一个 vote 函数，允许用户投票给某个候选人
    function vote(string calldata candidate) public {
        if(votes[candidate] == 0){
            candidates.push(candidate);
        }
        votes[candidate]++;
    }

    //一个 getVotes 函数，返回某个候选人的得票数
    function getVotes(string calldata candidate) public view returns (uint) {
        return votes[candidate];
    }

    //一个 resetVotes 函数，重置所有候选人的得票数
    function resetVotes() public {
        uint len = candidates.length;
        for (uint i = 0; i < len; i++) {
            votes[candidates[i]] = 0;
        }
        delete candidates;  // 清空数组
    }
}

//反转字符串
contract ReverseString {
    function reverse(string calldata input) public pure returns (string memory) {
        bytes calldata inputBytes = bytes(input);
        bytes memory reversedBytes = new bytes(inputBytes.length);
        
        for (uint i = 0; i < inputBytes.length; i++) {
            reversedBytes[i] = inputBytes[inputBytes.length - 1 - i];
        }
        
        return string(reversedBytes);
    }
}

//实现整数转罗马数字
contract IntegerToRoman {
    // 核心：按规则定义数值-罗马字符映射（从大到小，包含减法形式）
    struct RomanMapping {
        uint256 value;
        string symbol;
    }

    // 整数转罗马数字（严格遵循题目规则）
    function intToRoman(uint256 num) public pure returns (string memory) {
        // 校验输入范围：罗马数字标准范围 1~3999
        require(num >= 1 && num <= 3999, "Number must be between 1 and 3999");

        // 定义所有可能的数值-字符组合（包含减法形式，符合题目规则）
        RomanMapping[] memory mappings = new RomanMapping[](13);
        mappings[0] = RomanMapping({value: 1000, symbol: "M"});
        mappings[1] = RomanMapping({value: 900, symbol: "CM"});  // 减法形式：900=1000-100
        mappings[2] = RomanMapping({value: 500, symbol: "D"});
        mappings[3] = RomanMapping({value: 400, symbol: "CD"});  // 减法形式：400=500-100
        mappings[4] = RomanMapping({value: 100, symbol: "C"});
        mappings[5] = RomanMapping({value: 90, symbol: "XC"});   // 减法形式：90=100-10
        mappings[6] = RomanMapping({value: 50, symbol: "L"});
        mappings[7] = RomanMapping({value: 40, symbol: "XL"});   // 减法形式：40=50-10
        mappings[8] = RomanMapping({value: 10, symbol: "X"});
        mappings[9] = RomanMapping({value: 9, symbol: "IX"});    // 减法形式：9=10-1
        mappings[10] = RomanMapping({value: 5, symbol: "V"});
        mappings[11] = RomanMapping({value: 4, symbol: "IV"});   // 减法形式：4=5-1
        mappings[12] = RomanMapping({value: 1, symbol: "I"});

        // 拼接结果（bytes 比 string 更高效）
        bytes memory result = new bytes(0);
        
        // 贪心算法：从最大数值开始匹配，符合「从最高到最低小数位转换」规则
        for (uint256 i = 0; i < mappings.length; i++) {
            // 循环减去当前最大可匹配值，拼接对应字符（自然满足「最多连续3次10的次方」规则）
            while (num >= mappings[i].value) {
                result = abi.encodePacked(result, mappings[i].symbol);
                num -= mappings[i].value;
            }
        }

        return string(result);
    }
}


//实现罗马数字转数整数
contract RomanToInteger {
    // 定义罗马字符到数值的映射（核心字典）
    function getValue(bytes1 char) private pure returns (uint256) {
        if (char == 'I') return 1;
        if (char == 'V') return 5;
        if (char == 'X') return 10;
        if (char == 'L') return 50;
        if (char == 'C') return 100;
        if (char == 'D') return 500;
        if (char == 'M') return 1000;
        revert("Invalid Roman character"); // 非法字符报错
    }

    // 罗马数字转整数
    function romanToInt(string memory roman) public pure returns (uint256) {
        bytes memory romanBytes = bytes(roman); // 转bytes方便逐个字符操作
        uint256 total = 0;
        uint256 length = romanBytes.length;

        // 遍历每个字符，判断常规/减法规则
        for (uint256 i = 0; i < length; i++) {
            uint256 current = getValue(romanBytes[i]);
            
            // 如果当前字符值 < 下一个字符值 减法规则（如IV=5-1，IX=10-1）
            if (i < length - 1 && current < getValue(romanBytes[i+1])) {
                total -= current; // 减法：当前值从总和中减去
            } else {
                total += current; // 常规：当前值加到总和中
            }
        }

        return total;
    }
}

//合并两个有序数组 (Merge Sorted Array)
contract MergeSortedArrays {
    // arr1（有序）、arr2（有序）；输出：合并后的有序数组
    function merge(
        uint256[] calldata arr1,
        uint256[] calldata arr2
    ) public pure returns (uint256[] memory) {
        //  获取两个数组长度
        uint256 len1 = arr1.length;
        uint256 len2 = arr2.length;
        uint256 totalLen = len1 + len2;
        
        //  初始化结果数组（长度为两个数组长度之和）
        uint256[] memory result = new uint256[](totalLen);
        
        // 定义：i 指向数组1，j 指向数组2，k 指向最终结果
        uint256 i = 0;
        uint256 j = 0;
        uint256 k = 0;
        
        // 遍历，按大小合并
        while (i < len1 && j < len2) {
            if (arr1[i] <= arr2[j]) {
                result[k] = arr1[i];
                i++; // 数组1指针后移
            } else {
                result[k] = arr2[j];
                j++; // 数组2指针后移
            }
            k++; // 结果指针后移
        }
        
        // 处理数组1剩余元素（如果有）
        while (i < len1) {
            result[k] = arr1[i];
            i++;
            k++;
        }
        
        // 处理数组2剩余元素（如果有）
        while (j < len2) {
            result[k] = arr2[j];
            j++;
            k++;
        }
        
        return result;
    }
}

//二分查找 (Binary Search)
contract BinarySearch {
    // 找到则返回目标值的索引；未找到返回 -1（用int256兼容负数）
    function binarySearch(
        uint256[] memory sortedArr, // 升序有序数组
        uint256 target              // 要查找的目标值
    ) public pure returns (int256) {
        // 边界处理：空数组直接返回-1
        if (sortedArr.length == 0) {
            return -1;
        }

        // 初始化左右指针
        uint256 left = 0;
        uint256 right = sortedArr.length - 1;

        // 核心二分逻辑：左指针 <= 右指针时循环
        while (left <= right) {
            // 计算中间索引（避免溢出：不用 (left+right)/2，改用 left + (right-left)/2）
            uint256 mid = left + (right - left) / 2;

            if (sortedArr[mid] == target) {
                return int256(mid); // 找到目标，返回索引（转int256兼容-1）
            } else if (sortedArr[mid] < target) {
                left = mid + 1; // 目标在右半区，左指针右移
            } else {
                // 处理right=0时的溢出（right-1可能下溢）
                if (mid == 0) {
                    break;
                }
                right = mid - 1; // 目标在左半区，右指针左移
            }
        }

        return -1; // 未找到目标值
    }
}