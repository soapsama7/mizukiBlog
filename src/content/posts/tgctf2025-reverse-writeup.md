---
title: TGCTF2025 reverse Writeup
published: 2025-04-15 19:26:13
description: TGCTF2025 Writeup
pinned: false
tags: [reverse,CTF]
category: ctfWriteup
---

一个人打的，狗运不错拿了个二血，但最后憋不出来一道题掉100多名了

也就写出来三道逆向和一些简单的misc、crypto，以复现逆向为主

## Base64

正好借这道题彻底理解base64的原理以及代码实现了，之前其实一直没有在意过

逻辑很简单，就是一个魔改base64，比赛的时候我的AI非常给力，直接给我代码了

```
def custom_b64decode(encoded_str):
    # 自定义编码表
    custom_table = "GLp/+Wn7uqX8FQ2JDR1c0M6U53sjBwyxglmrCVdSThAfEOvPHaYZNzo4ktK9iebI"

    # 创建逆向映射字典（字符 -> 原始6位值）
    rev_table = {char: (idx - 24) % 64 for idx, char in enumerate(custom_table)}  # 关键逆向偏移

    # 预处理：移除填充并计算有效长度
    pad_count = encoded_str.count('=')
    encoded_clean = encoded_str.rstrip('=')

    # 转换为二进制流
    binary_stream = []
    for i in range(0, len(encoded_clean), 4):
        chunk = encoded_clean[i:i + 4]
        bits = 0
        valid_bits = 0

        # 处理每个字符
        for c in chunk:
            if c not in rev_table:
                continue  # 跳过无效字符
            bits = (bits << 6)  rev_table[c]
            valid_bits += 6

        # 提取有效字节
        while valid_bits >= 8:
            byte = (bits >> (valid_bits - 8)) & 0xFF
            binary_stream.append(byte)
            valid_bits -= 8
            bits &= (1 << valid_bits) - 1  # 清除已处理的高位

    # 处理填充逻辑
    if pad_count == 1:
        binary_stream = binary_stream[:-1]  # 移除最后一个因填充产生的0字节
    elif pad_count == 2:
        binary_stream = binary_stream[:-2]  # 移除最后两个0字节

    return bytes(binary_stream)

a=custom_b64decode('AwLdOEVEhIWtajB2CbCWCbTRVsFFC8hirfiXC9gWH9HQayCJVbB8CIF=')
print(a)
```

但复现肯定要细想一下逻辑，魔改在哪？  
第一部分是换表，很显然，而第二部分则是偏移

具体来说，在最后的索引步骤中，将得到的索引值+24后再对64取余，才是这道题真正的索引值

![](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest/img/1744723548-image.png)

那么解码的时候也要注意这一点

## 水果忍者

没什么好说的，找到代码，就是一个AES解密，数据都给了直接套

## XTEA

拿二血的题，其实有点考脑洞。这道题给了两个附件，用ida分析来看，它们是一样的

我最开始想，会不会用bindiff分析差异函数？但bindiff分析没任何结果，它们是一样的

后面又试了很多检测二者文件是否一致的方法，结果都指明这两个程序是一样的程序，没有任何差别

那就先不管了，直接分析一下程序

前面有一个反调试会影响随机种子，直接过掉就行

![](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest/img/1744766206-image-1024x300.png)

输入长度为32的字符串，经循环解析成长度为8，数据为int类型的数组v10，再经tea加密

其中key由程序动态生成，但delta未知，需要我们手动输入

这里的delta其实就是题目给的压缩包密码，将压缩包密码转成十六进制也可以看出来是0x9e3779b9

tea加密也没有魔改，直接计算即可

```
from ctypes import *
from Crypto.Util import *
def reverse_packing(v10):
    flag_bytes = bytearray(32)
    for i in range(8):
        # 从v10中读取32位整数
        value = v10[i]
        # 按大端序拆解为4字节
        flag_bytes[i*4]   = (value >> 24) & 0xFF  # 最高位字节 → 原始位置j
        flag_bytes[i*4+1] = (value >> 16) & 0xFF  # 次高位字节 → 原始位置j+1
        flag_bytes[i*4+2] = (value >> 8)  & 0xFF  # 第三字节 → 原始位置j+2
        flag_bytes[i*4+3] = value & 0xFF          # 最低位字节 → 原始位置j+3
    return bytes(flag_bytes)
enc = [0x8CCB2324,0x9A7741A,0x0FB3C678D,0x0F6083A79,0x0F1CC241B,0x39FA59F2,0x0F2ABE1CC,0x17189F72]
key = [0x19F8,0x11be,0x991,0x3418]
for i in range(len(enc) - 2, -1, -1):
    v0 = c_uint32(enc[i])
    v1 = c_uint32(enc[i+1])
    delta = 0x61C88647
    r = 32
    sum = c_uint32(r * delta)
    for j in range(r):
        v1.value -= (key[(sum.value >> 11) & 3] + sum.value) ^ (v0.value + ((v0.value >> 5) ^ (v0.value << 4)))
        sum.value -= delta
        v0.value -= (key[sum.value & 3] + sum.value) ^ (v1.value + ((v1.value >> 5) ^ (v1.value << 4)))
    enc[i] = v0.value
    enc[i+1] = v1.value
flag=[]
for i in range(8):
    flag.append(hex(enc[i]))
a=reverse_packing(enc)
print(a)
```

## 蛇年的本命语言（复现）

挺常规的python逆向，看原代码就行，逻辑不难理解，但我踩坑了

![](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest/img/1744771719-image.png)

具体来说，上面这段代码，从源程序反编译出来的for循环后面是没有东西的，需要补充我们输入的flag

但我补充的是count，所以即使把正确的flag填进去， 也会报错

再就是我没见过count，确实不了解这个东西，比赛的时候我明明连z3都解出来了，但就是因为不理解count，最后的flag一直做不出来......也是被自己蠢到了

其实z3解出来后直接对着count得到的值一一对应就行了

## exchange（复现）

![](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest/img/1744849720-image.png)

将我们输入的长度为41的字符串，先去掉前后缀HZNUCTF{}，再对中间的32个字符进行加密操作，具体操作为：以每两位字符为单位，先转成ASCII值，再进行一种“置换”

比如两位字符为"aa"，先转为ASCII成61，61，再将“中间“两位数置换，变成66，11。然后再合并，这样就变成了四位字符，最终将长度为32的字符串变为64长度

sub\_7FF6EDF713ED函数实现了一个魔改的DES并进行原文加密后的验证操作

![](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest/img/1744849761-image.png)

那么主要就是看这个DES加密了

![](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest/img/1744849786-image.png)

这里上面是DES，下面是三DES（密钥相同），给出了一个DES解密函数，但加密逻辑只会走上面（这里上面的应该是DES\_encrypt）

那么非预期解就是，直接把上面的encrypt函数变成decrypt函数，让程序自解密

动态调试，先随便输入一些符合格式的字符串，在进入sub\_7FF6EDF713ED之前下断，手动把密文patch进要进行DES的字节

```
import ida_bytes

# 需要修改的起始地址（替换为你目标地址）
start_addr = 0x0000002EBDCFFBE0

# 要写入的数据数组
data = [
  132,139,3,34,20,190,223,117,179,213,118,111,205,42,93,215,
  77,178,95,6,152,157,62,168,247,35,242,139,242,84,101,122,
  32,192,135,85,214,59,70,61,247,178,122,157,194,207,26,174,
  22,199,21,48,142,253,143,158,170,57,171,254,149,167,31,241
]

for offset, byte in enumerate(data):
    ida_bytes.patch_byte(start_addr + offset, byte)

print(f"Successfully written {len(data)} bytes at {hex(start_addr)}")
```

然后运行到这个地方，把encrypt函数直接变成decrypt函数就行，它们的参数都一样，前面产生密钥流的函数也一样

![](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest/img/1744850119-image-1024x341.png)

运行出来后看Src，可以看到已经被改变了

![](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest/img/1744850172-image-1024x341.png)

提取出来，再按照前面的逻辑修改

```
a=[  0x33, 0x33, 0x33, 0x39, 0x33, 0x36, 0x31, 0x34, 0x37, 0x33,
  0x33, 0x32, 0x36, 0x33, 0x32, 0x39, 0x32, 0x33, 0x64, 0x39,
  0x36, 0x33, 0x35, 0x33, 0x33, 0x32, 0x31, 0x64, 0x33, 0x33,
  0x34, 0x35, 0x36, 0x33, 0x36, 0x38, 0x32, 0x36, 0x64, 0x32,
  0x36, 0x33, 0x31, 0x34, 0x36, 0x32, 0x31, 0x64, 0x33, 0x33,
  0x34, 0x39, 0x33, 0x33, 0x30, 0x34, 0x36, 0x33, 0x31, 0x32,
  0x36, 0x33, 0x34, 0x38]
for i in range(1,len(a),4):
    a[i],a[i+1]=a[i+1],a[i]
b='33393164733262392d396533312d343566382d626134612d3439303461326438'
for i in range(0,len(b),2):
    print(chr(int(b[i:i+2],16)),end='')
```

而预期解就是要找到DES被魔改在哪，然后调整标准的DES解密

这道题对DES的魔改就一个方面，就是**循环左移表**被改变，其它地方全部都是标准的DES

但官方的wp给出的S盒似乎与标准的S盒不太一致，这个地方我学习了一下（ds的回答）

![](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest/img/1744865222-image.png)

具体来说，反编译出来的这个S盒里面的数据，对应了所有的6位二进制数字输入所得到的输出，等价于标准DES加密的这一部分

![](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest/img/1744869202-image.png)

对于反编译所得到的S盒，我们只需要将前面异或得到的48位原文传入，进行一些位运算，就可以直接得到32位的输出，不再进行标准DES加密的流程，这与反编译得到的代码一致，但本质都是DES加密，只是执行的过程不一样，使用标准的DES解密也可以得到正确输出

![](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest/img/1744869416-image-1024x331.png)

可以直接复制原反编译的加密代码修改一下，然后直接从内存里提取出来生成的密钥流解密即可（抄了liv佬的代码）

```
#include <iostream>
#include <windows.h>
#include <string>
#include <time.h>

unsigned int s1[64] = {
    0x01010400, 0x00000000, 0x00010000, 0x01010404, 0x01010004, 0x00010404, 0x00000004, 0x00010000,
    0x00000400, 0x01010400, 0x01010404, 0x00000400, 0x01000404, 0x01010004, 0x01000000, 0x00000004,
    0x00000404, 0x01000400, 0x01000400, 0x00010400, 0x00010400, 0x01010000, 0x01010000, 0x01000404,
    0x00010004, 0x01000004, 0x01000004, 0x00010004, 0x00000000, 0x00000404, 0x00010404, 0x01000000,
    0x00010000, 0x01010404, 0x00000004, 0x01010000, 0x01010400, 0x01000000, 0x01000000, 0x00000400,
    0x01010004, 0x00010000, 0x00010400, 0x01000004, 0x00000400, 0x00000004, 0x01000404, 0x00010404,
    0x01010404, 0x00010004, 0x01010000, 0x01000404, 0x01000004, 0x00000404, 0x00010404, 0x01010400,
    0x00000404, 0x01000400, 0x01000400, 0x00000000, 0x00010004, 0x00010400, 0x00000000, 0x01010004};
unsigned int s2[64] = {
    0x80108020, 0x80008000, 0x00008000, 0x00108020, 0x00100000, 0x00000020, 0x80100020, 0x80008020,
    0x80000020, 0x80108020, 0x80108000, 0x80000000, 0x80008000, 0x00100000, 0x00000020, 0x80100020,
    0x00108000, 0x00100020, 0x80008020, 0x00000000, 0x80000000, 0x00008000, 0x00108020, 0x80100000,
    0x00100020, 0x80000020, 0x00000000, 0x00108000, 0x00008020, 0x80108000, 0x80100000, 0x00008020,
    0x00000000, 0x00108020, 0x80100020, 0x00100000, 0x80008020, 0x80100000, 0x80108000, 0x00008000,
    0x80100000, 0x80008000, 0x00000020, 0x80108020, 0x00108020, 0x00000020, 0x00008000, 0x80000000,
    0x00008020, 0x80108000, 0x00100000, 0x80000020, 0x00100020, 0x80008020, 0x80000020, 0x00100020,
    0x00108000, 0x00000000, 0x80008000, 0x00008020, 0x80000000, 0x80100020, 0x80108020, 0x00108000};
unsigned int s3[64] = {
    0x00000208, 0x08020200, 0x00000000, 0x08020008, 0x08000200, 0x00000000, 0x00020208, 0x08000200,
    0x00020008, 0x08000008, 0x08000008, 0x00020000, 0x08020208, 0x00020008, 0x08020000, 0x00000208,
    0x08000000, 0x00000008, 0x08020200, 0x00000200, 0x00020200, 0x08020000, 0x08020008, 0x00020208,
    0x08000208, 0x00020200, 0x00020000, 0x08000208, 0x00000008, 0x08020208, 0x00000200, 0x08000000,
    0x08020200, 0x08000000, 0x00020008, 0x00000208, 0x00020000, 0x08020200, 0x08000200, 0x00000000,
    0x00000200, 0x00020008, 0x08020208, 0x08000200, 0x08000008, 0x00000200, 0x00000000, 0x08020008,
    0x08000208, 0x00020000, 0x08000000, 0x08020208, 0x00000008, 0x00020208, 0x00020200, 0x08000008,
    0x08020000, 0x08000208, 0x00000208, 0x08020000, 0x00020208, 0x00000008, 0x08020008, 0x00020200};
unsigned int s4[64] = {
    0x00802001, 0x00002081, 0x00002081, 0x00000080, 0x00802080, 0x00800081, 0x00800001, 0x00002001,
    0x00000000, 0x00802000, 0x00802000, 0x00802081, 0x00000081, 0x00000000, 0x00800080, 0x00800001,
    0x00000001, 0x00002000, 0x00800000, 0x00802001, 0x00000080, 0x00800000, 0x00002001, 0x00002080,
    0x00800081, 0x00000001, 0x00002080, 0x00800080, 0x00002000, 0x00802080, 0x00802081, 0x00000081,
    0x00800080, 0x00800001, 0x00802000, 0x00802081, 0x00000081, 0x00000000, 0x00000000, 0x00802000,
    0x00002080, 0x00800080, 0x00800081, 0x00000001, 0x00802001, 0x00002081, 0x00002081, 0x00000080,
    0x00802081, 0x00000081, 0x00000001, 0x00002000, 0x00800001, 0x00002001, 0x00802080, 0x00800081,
    0x00002001, 0x00002080, 0x00800000, 0x00802001, 0x00000080, 0x00800000, 0x00002000, 0x00802080};
unsigned int s5[64] = {
    0x00000100, 0x02080100, 0x02080000, 0x42000100, 0x00080000, 0x00000100, 0x40000000, 0x02080000,
    0x40080100, 0x00080000, 0x02000100, 0x40080100, 0x42000100, 0x42080000, 0x00080100, 0x40000000,
    0x02000000, 0x40080000, 0x40080000, 0x00000000, 0x40000100, 0x42080100, 0x42080100, 0x02000100,
    0x42080000, 0x40000100, 0x00000000, 0x42000000, 0x02080100, 0x02000000, 0x42000000, 0x00080100,
    0x00080000, 0x42000100, 0x00000100, 0x02000000, 0x40000000, 0x02080000, 0x42000100, 0x40080100,
    0x02000100, 0x40000000, 0x42080000, 0x02080100, 0x40080100, 0x00000100, 0x02000000, 0x42080000,
    0x42080100, 0x00080100, 0x42000000, 0x42080100, 0x02080000, 0x00000000, 0x40080000, 0x42000000,
    0x00080100, 0x02000100, 0x40000100, 0x00080000, 0x00000000, 0x40080000, 0x02080100, 0x40000100};
unsigned int s6[64] = {
    0x20000010, 0x20400000, 0x00004000, 0x20404010, 0x20400000, 0x00000010, 0x20404010, 0x00400000,
    0x20004000, 0x00404010, 0x00400000, 0x20000010, 0x00400010, 0x20004000, 0x20000000, 0x00004010,
    0x00000000, 0x00400010, 0x20004010, 0x00004000, 0x00404000, 0x20004010, 0x00000010, 0x20400010,
    0x20400010, 0x00000000, 0x00404010, 0x20404000, 0x00004010, 0x00404000, 0x20404000, 0x20000000,
    0x20004000, 0x00000010, 0x20400010, 0x00404000, 0x20404010, 0x00400000, 0x00004010, 0x20000010,
    0x00400000, 0x20004000, 0x20000000, 0x00004010, 0x20000010, 0x20404010, 0x00404000, 0x20400000,
    0x00404010, 0x20404000, 0x00000000, 0x20400010, 0x00000010, 0x00004000, 0x20400000, 0x00404010,
    0x00004000, 0x00400010, 0x20004010, 0x00000000, 0x20404000, 0x20000000, 0x00400010, 0x20004010};
unsigned int s7[64] = {
    0x00200000, 0x04200002, 0x04000802, 0x00000000, 0x00000800, 0x04000802, 0x00200802, 0x04200800,
    0x04200802, 0x00200000, 0x00000000, 0x04000002, 0x00000002, 0x04000000, 0x04200002, 0x00000802,
    0x04000800, 0x00200802, 0x00200002, 0x04000800, 0x04000002, 0x04200000, 0x04200800, 0x00200002,
    0x04200000, 0x00000800, 0x00000802, 0x04200802, 0x00200800, 0x00000002, 0x04000000, 0x00200800,
    0x04000000, 0x00200800, 0x00200000, 0x04000802, 0x04000802, 0x04200002, 0x04200002, 0x00000002,
    0x00200002, 0x04000000, 0x04000800, 0x00200000, 0x04200800, 0x00000802, 0x00200802, 0x04200800,
    0x00000802, 0x04000002, 0x04200802, 0x04200000, 0x00200800, 0x00000000, 0x00000002, 0x04200802,
    0x00000000, 0x00200802, 0x04200000, 0x00000800, 0x04000002, 0x04000800, 0x00000800, 0x00200002};
unsigned int s8[64] = {
    0x10001040, 0x00001000, 0x00040000, 0x10041040, 0x10000000, 0x10001040, 0x00000040, 0x10000000,
    0x00040040, 0x10040000, 0x10041040, 0x00041000, 0x10041000, 0x00041040, 0x00001000, 0x00000040,
    0x10040000, 0x10000040, 0x10001000, 0x00001040, 0x00041000, 0x00040040, 0x10040040, 0x10041000,
    0x00001040, 0x00000000, 0x00000000, 0x10040040, 0x10000040, 0x10001000, 0x00041040, 0x00040000,
    0x00041040, 0x00040000, 0x10041000, 0x00001000, 0x00000040, 0x10040040, 0x00001000, 0x00041040,
    0x10001000, 0x00000040, 0x10000040, 0x10040000, 0x10040040, 0x10000000, 0x00040000, 0x10001040,
    0x00000000, 0x10041040, 0x00040040, 0x10000040, 0x10040000, 0x10001000, 0x10001040, 0x00000000,
    0x10041040, 0x00041000, 0x00041000, 0x00001040, 0x00001040, 0x00040040, 0x10000000, 0x10041000};

void __fastcall des_encrypt(unsigned int *_a1_, DWORD *_a2_)
{
    unsigned int left = _a1_[1];
    unsigned int right = _a1_[0];

    unsigned int temp = (left ^ (right >> 4)) & 0xF0F0F0F;
    left = temp ^ left;
    right = (temp << 4) ^ right;

    temp = (left ^ (right >> 16)) & 0x0000FFFF;
    left = temp ^ left;
    right = (temp << 16) ^ right;

    temp = (right ^ (left >> 2)) & 0x33333333;
    right = temp ^ right;
    left = (temp << 2) ^ left;

    temp = (right ^ (left >> 8)) & 0x00FF00FF;
    right = temp ^ right;
    left = (((temp << 8) ^ left) >> 31)  (2 * ((temp << 8) ^ left));

    temp = (left ^ right) & 0xAAAAAAAA;
    left = temp ^ left;
    right = ((temp ^ right) >> 31)  (2 * (temp ^ right));

    for (int i = 0; i < 8; i++)
    {
        temp = *_a2_++ ^ ((left >> 4)  (left << 28));
        unsigned int result1 = s1[(temp >> 24) & 0x3F] 
                               s3[(temp >> 16) & 0x3F] 
                               s5[(temp >> 8) & 0x3F] 
                               s7[temp & 0x3F];
        temp = *_a2_++ ^ left;

        right ^= s2[(temp >> 24) & 0x3F] 
                 s4[(temp >> 16) & 0x3F] 
                 s6[(temp >> 8) & 0x3F] 
                 s8[temp & 0x3F] 
                 result1;

        temp = *_a2_++ ^ ((right >> 4)  (right << 28));
        result1 = s1[(temp >> 24) & 0x3F] 
                  s3[(temp >> 16) & 0x3F] 
                  s5[(temp >> 8) & 0x3F] 
                  s7[temp & 0x3F];

        temp = *_a2_++ ^ right;
        left ^= s2[(temp >> 24) & 0x3F] 
                s4[(temp >> 16) & 0x3F] 
                s6[(temp >> 8) & 0x3F] 
                s8[temp & 0x3F] 
                result1;
    }
    left = (left >> 1)  (left << 31);
    temp = (left ^ right) & 0xAAAAAAAA;
    left = temp ^ left;
    right = ((temp ^ right) >> 1)  ((temp ^ right) << 31);

    temp = (left ^ (right >> 8)) & 0xFF00FF;
    left = temp ^ left;
    right = (temp << 8) ^ right;

    temp = (left ^ (right >> 2)) & 0x33333333;
    left = temp ^ left;
    right = (temp << 2) ^ right;

    temp = (right ^ (left >> 16)) & 0xFFFF;
    right = temp ^ right;
    left = (temp << 16) ^ left;

    temp = (right ^ (left >> 4)) & 0x0F0F0F0F;

    _a1_[0] = (temp << 4) ^ left;
    _a1_[1] = temp ^ right;
}

int main()
{
    unsigned int key[64] = {
        0x2C0B3C36, 0x09221A0A, 0x2829051D, 0x09123B0D, 0x2C091B18, 0x0512011F, 0x09292E17, 0x07122920,
        0x090D1703, 0x0514372E, 0x0915123C, 0x27100E27, 0x01050927, 0x25150D29, 0x13151F32, 0x24112618,
        0x03052031, 0x34312B37, 0x13043A05, 0x3C19151B, 0x23063B3E, 0x34293830, 0x03062108, 0x380B3F2A,
        0x260E063D, 0x3009141B, 0x0E223D3D, 0x300B0124, 0x062A1700, 0x11093D14, 0x0E22262B, 0x1208083E,
        0x0E22262B, 0x1208083E, 0x062A1700, 0x11093D14, 0x0E223D3D, 0x300B0124, 0x260E063D, 0x3009141B,
        0x03062108, 0x380B3F2A, 0x23063B3E, 0x34293830, 0x13043A05, 0x3C19151B, 0x03052031, 0x34312B37,
        0x13151F32, 0x24112618, 0x01050927, 0x25150D29, 0x0915123C, 0x27100E27, 0x090D1703, 0x0514372E,
        0x09292E17, 0x07122920, 0x2C091B18, 0x0512011F, 0x2829051D, 0x09123B0D, 0x2C0B3C36, 0x09221A0A};

    unsigned int data[64] = {
        0x00000084, 0x0000008B, 0x00000003, 0x00000022, 0x00000014, 0x000000BE, 0x000000DF, 0x00000075,
        0x000000B3, 0x000000D5, 0x00000076, 0x0000006F, 0x000000CD, 0x0000002A, 0x0000005D, 0x000000D7,
        0x0000004D, 0x000000B2, 0x0000005F, 0x00000006, 0x00000098, 0x0000009D, 0x0000003E, 0x000000A8,
        0x000000F7, 0x00000023, 0x000000F2, 0x0000008B, 0x000000F2, 0x00000054, 0x00000065, 0x0000007A,
        0x00000020, 0x000000C0, 0x00000087, 0x00000055, 0x000000D6, 0x0000003B, 0x00000046, 0x0000003D,
        0x000000F7, 0x000000B2, 0x0000007A, 0x0000009D, 0x000000C2, 0x000000CF, 0x0000001A, 0x000000AE,
        0x00000016, 0x000000C7, 0x00000015, 0x00000030, 0x0000008E, 0x000000FD, 0x0000008F, 0x0000009E,
        0x000000AA, 0x00000039, 0x000000AB, 0x000000FE, 0x00000095, 0x000000A7, 0x0000001F, 0x000000F1};

    unsigned char Enc[64]{};
    for (int i = 0; i < 64; i++)
        Enc[i] = data[i];

    // 四字节一组翻转
    for (int i = 0; i < 64; i += 4)
    {
        auto a = Enc[i], b = Enc[i + 1], c = Enc[i + 2], d = Enc[i + 3];
        Enc[i] = d;
        Enc[i + 1] = c;
        Enc[i + 2] = b;
        Enc[i + 3] = a;
    }
    
    // DES解密（用后32个key）
    for (int i = 0; i < 64; i += 8)
        des_encrypt((unsigned int *)(Enc + i), (DWORD *)(key + 32));

    // 四字节一组翻转
    for (int i = 0; i < 64; i += 4)
    {
        auto a = Enc[i], b = Enc[i + 1], c = Enc[i + 2], d = Enc[i + 3];
        Enc[i] = d;
        Enc[i + 1] = c;
        Enc[i + 2] = b;
        Enc[i + 3] = a;
    }

    printf("HZNUCTF{");
    // 逆向初始字符串变换
    for (int i = 0; i < 64; i += 4)
    {
        std::string tmp1;
        tmp1 += Enc[i];
        tmp1 += Enc[i + 2];

        std::string tmp2;
        tmp2 += Enc[i + 1];
        tmp2 += Enc[i + 3];

        printf("%c", char(std::stoi(tmp1, 0, 16)));
        printf("%c", char(std::stoi(tmp2, 0, 16)));
    }

    printf("}\n");

    return 0;
}
```

两次翻转是为了对齐大小端序

* * *

折磨我好久啊这题，比赛的时候就做了几个小时，知道它是DES，但是死活出不来，也没有想过非预期，一直对着代码看就是看不出来为什么......但我其实之前从来没有了解过DES的原理和细节，要么cyberchef，要么直接抄代码然后改一些值了事，这也能应对大多数题目。但这题确实给我创飞了，也借这道题了解了DES的代码实现过程，还算是有所收获

## Conforand（复现）

感觉预期解没什么可以学习的。。。。。。完全就是硬看，D810其实也没什么用，但可以借此了解OLLVM混淆这个东西，以前确实也没接触过，同时[TGCTF 2025 逆向WP Liv's blog](https://tkazer.github.io/2025/04/13/TGCTF2025/index.html)这个大佬的非预期也很强，所以这道题我的复现主要以理解Liv的思路和学习OLLVM为主

这道题虽然混淆严重，代码可读性极差，但函数名却没有作任何混淆

![](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest/img/1744879296-image.png)

因此可以得知，这道题应该就是一个魔改的RC4加密，那么只要知道在哪魔改了就行，但由于混淆严重，代码特别难看，找到魔改的地方并不算容易

不过根据srand、rand、time等函数调用可以知道，魔改后RC4的sbox生成一定与rand产生的随机数有关

同时应该注意到，标准的RC4属于对称加密，即输入原文得到密文，输入密文得到原文，那这里就应该验证一下这道题的RC4是否具有对称性，借用一下Liv佬的博客

![](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest/img/1744880050-image.png)

经过验证可以得知，在随机数rand一致的情况下，程序内部的RC4函数具有对称性。若输入密文，可以自解密出原文，那么我应该可以通过某种方式来调用这个程序内部的RC4函数帮助我直接把密文还原回flag，就不再需要去理解RC4内部实现的细节了

这里学习了一个我之前一直想实现的功能：调用程序中原本存在的函数进行某些操作，这里还是借一下liv佬的代码，即这道题的最终解密代码

```
#include <stdio.h>
#include <stdlib.h>
#include "include/load_elf.h"
#include "include/logger.h"
#include "include/breakpoint.h"

int main() 
{
        const char* path = "./conforand";
        void* base = load_elf(path);

        __uint64_t  (*rc4)(unsigned char*, unsigned long long, unsigned char*, unsigned long long) = get_symbol_by_offset(base,0x413170);

        unsigned char key[]="JustDoIt!";

        for(int i=0; i<1000000; i++)
        {
                unsigned char EncData[]={0x83,0x1e,0x9c,0x48,0x7a,0xfa,0xe8,0x88,0x36,0xd5,0x0a,0x08,0xf6,0xa7,0x70,0x0f,0xfd,0x67,0xdd,0xd4,0x3c,0xa7,0xed,0x8d,0x51,0x10,0xce,0x6a,0x9e,0x56,0x57,0x83,0x56,0xe7,0x67,0x9a,0x67,0x22,0x24,0x6e,0xcd,0x2f};

                *(unsigned int*)(0x4068D3) = i;

                rc4(EncData,42,key,9);
                
                if(EncData[0] == 'H' 
                        && EncData[1] == 'Z'
                        && EncData[2] == 'N')
                {
                        printf("Seed:%d\n",i);
                        printf("%.42s\n",EncData);
                        break;
                }
        }
        return 0;
}
```

这里使用了一个[https://github.com/IchildYu/load-elf](https://github.com/IchildYu/load-elf) 库，可以加载elf文件并让我们能够调用它的内部函数，这里就调用RC4，那么接下来我们需要patch改一下程序然后转储（dump）下来，再调用上面那个代码自解密就行，具体更改逻辑也不赘述，都抄大佬的（（（

![](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest/img/1744944598-image-1024x341.png)

这里有个地方我进行了一些不一样的操作，在模仿patch后，我发现生成的elf无法运行，会直接报段错误

原因是init函数会在之前被调用，而我们却修改了init函数，因此在调用的这个地方一定会出问题导致程序无法运行，所以我把它直接nop掉，不调用init函数了。在源程序中，这个函数对于flag的加密仅仅只有提供密钥的作用，但由于我们可以直接提取出密钥，所以在解密中，这个函数没有任何作用，可以直接nop掉

![](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest/img/1744985790-image-1024x587.png)

可以看到现在这个程序可以正常运行，没有问题，但和原程序相比会少输出一段密钥的内容

![](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest/img/1744986237-image-1024x112.png)

但接下来的代码执行阶段才是重点，我先是抄了liv佬的代码，正常编译（使用gcc）

![](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest/img/1744986376-image.png)

（几乎完全没用过命令行编译，对linux也不熟悉，这一步操作我搜+问AI搞了很久，一直报错报错报错才改对）

接下来运行

![](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest/img/1744986474-image.png)

由于过于若至，这一步硬控我几个小时，最后我直接加liv佬好友问了一下才出的结果，记录一下我的排查流程：

前面提到我将原来程序唯一一次调用init函数的地方nop掉，这是因为我最开始排查原因的时候第一个想到的是patch后的程序是否出现异常

因此我测试运行patch后的程序，出现了一样的错误，即段错误（没截图）

于是我想到了上面的修改方式，修改之后程序确实可以运行了，但还是无法执行解密代码，段错误仍然存在。但之后我不死心，我想应该还是程序本身的问题，因为代码我都是照抄的，应该不会出错，于是我到处找elf文件的相关知识，搜索无果

绝望后终于把目光看向代码本身，说不定呢？又删删改改半天，还是没结果。。。

这个时候我又开始想，是我系统的问题吗？也许我的系统某些设置导致了解密程序运行错误。我找到原库的GitHub官网一顿乱翻，我把官网的一个“Hello cpp”的例子拿来运行，运行结果甚至错的一模一样

![](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest/img/1744987277-0d83be757b53b73b0825aaf5c6a5583b.png)

到这我真有点没辙了，官网给的这么简单的示例也能报段错误，看来既不是原程序的问题，也不是我解密代码的问题。如果真的是系统的问题，我感觉以我现在的水平恐怕也很难解决（况且这个概率也很小）

后来直接去问了一下liv佬，他给我编译后的解密程序，可以直接跑出正确的结果

![](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest/img/1744987411-ffbfe05cece54fbed7c4bdb68817dfa9.png)

并且得知是我的编译有问题，应该用make命令来编译而不是gcc编译

......make命令是什么（？）

看了一下，从GitHub仓库下下来的原压缩包确实是有makefile这个文件存在的，了解了一下这个东西之后再用make编译原代码，就可以正常解密了，真的是知识储备的问题

而我在编译的时候直接用gcc，缺少了某些必要的文件或者选项，比如x64\_do\_reloc.c这个源程序我就没有用到，因而导致编译出来的程序运行出错

简单来说，make是一个构建工具（不是编译器，跟cmake类似），它通过makefile里面定义的一些编译规则来编译源程序，而且可以直接调用编译器（即gcc）。makefile里面包含了编译某个C程序的全部流程，当我们需要编译一个C程序的时候，可以使用提前准备好的makefile工具一键编译文件，既方便又不容易出错

折腾半天总算是把解密程序编译出来了，运行一下得到正确答案

![](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest/img/1744988646-image.png)

到这里结束吧，这道题折磨我一整天，复现两种解法的时候出现各种问题，不知道重复多少次相同的操作（对着题解照抄->报错/看不懂为什么->查资料问AI->改错->报另一个错->查资料问AI）

但也算是有所收获，一个是接触并学习了OLLVM混淆，安装了D810这种去混淆的插件，下次再见不会再被吓到。第二个是实现了我很久之前就想到的功能：加载程序并调用它内部的函数。第三个则是对C/C++编译器和构建工具有了初步了解，摆脱了一直以来在vscode上面写代码的惯性认识，学习了一些编译器相关知识

## randomsystem（复现）

![](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest/img/1745132255-image.png)

前面需要我们输入一些东西，经过加密后再校验，这个东西后面会作为加密用的密钥

这里有两种方法，一种是常规的逆向破解，求解出输入的东西。第二种就是直接把if判断搞掉，然后把值patch进v23的地址，因为后面的加密不需要输入的初始值，只要加密后的值

比赛的时候我采用的是方法二，对于方法一，应该输入二进制字符串  
0101001001100101010101100110010101010010011001010101001101100101

前面这一段的两个函数都比较短，就不赘述分析流程了，继续往下看主要的部分

![](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest/img/1745134786-image.png)

这部分和输入没有关系，是程序内部自带的初始化列表，不用分析

之后是五次加密及验证，其中前四个函数都有花指令

![](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest/img/1745134831-image.png)

其实都是很基础的花指令，但是我对花指令相对陌生，且我确实很容易被陌生的一些东西唬住，不想耐心分析，这里不赘述去花过程（真的还不太会。。。），之后会写一篇学习花指令的文章，把这个当例题

去花后的四个函数为（官方wp）

![](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest/img/1745137016-image.png)

![](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest/img/1745137033-image.png)

![](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest/img/1745137041-image.png)

![](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest/img/1745137052-image.png)

各个函数的作用也不再赘述，各个大佬的wp都写过，这些函数都得出来了，这题差不多就已经解决

比赛时这道题难倒我的就是花指令，各个博客也并没有详细解释出来到底哪加了花、该怎么去花，我现在确实也不太会，在这里挖个坑吧~去详细学一下一些基础花指令的原理

## index（复现）

这题比赛的时候我看都没看，下下来三个附件还有js直接给我吓跑了，也没时间看这个，现在复现再来好好看看

这是个我没见过的wasm逆向，搜了一会wasm是什么东西，理解了一下三个附件的作用

第一个没有后缀的文件，这是wasm二进制核心逻辑文件，逆向的对象就是它

第二个html文件，就是个交互界面，因为wasm要依托于浏览器运行，但我没看明白这个界面

第三个js代码，这是那个网页的逻辑和wasm的宿主环境

说白了这三个东西搭在一起，就跟个exe可执行文件差不多，但主要逻辑在wasm二进制文件里，逆向分析也不用管其它两个文件

这题的wasm文件还改了一下魔数，把大写ASM的改成小写asm就行

需要用ghidra，因为有专门反编译wasm的插件[GitHub - nneonneo/ghidra-wasm-plugin: Ghidra Wasm plugin with disassembly and decompilation support](https://github.com/nneonneo/ghidra-wasm-plugin/) 这里不赘述安装过程了

找到主函数如下：

![](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest/img/1747036834-image-1024x544.png)

（不得不说感觉没ida好看...）

先把输入的flag乱序，然后再加密，慢慢分析即可

逆向加密算法如下：  

```
def unnamed_function_10(key21,param21):
    for _ in range(256):
        key21[_]^=param21
a=[ 0x84, 0x00, 0x00, 0x00, 0x1c, 0x00, 0x00, 0x00, 0x6b, 0x00, 0x00, 0x00, 0xf7, 0x00, 0x00, 0x00, 0x49, 0x00, 0x00, 0x00, 0x22, 0x00, 0x00, 0x00, 0xd6, 0x00, 0x00, 0x00, 0x42, 0x00, 0x00, 0x00, 0x50, 0x00, 0x00, 0x00, 0x7b, 0x00, 0x00, 0x00, 0x42, 0x00, 0x00, 0x00, 0xf4, 0x00, 0x00, 0x00, 0x46, 0x00, 0x00, 0x00, 0xa9, 0x00, 0x00, 0x00, 0x83, 0x00, 0x00, 0x00, 0x62, 0x00, 0x00, 0x00, 0xd1, 0x00, 0x00, 0x00, 0x32, 0x00, 0x00, 0x00, 0x80, 0x00, 0x00, 0x00, 0x42, 0x00, 0x00, 0x00, 0x6a, 0x00, 0x00, 0x00, 0x10, 0x00, 0x00, 0x00, 0xa3, 0x00, 0x00, 0x00, 0xf2, 0x00, 0x00, 0x00, 0xe2, 0x00, 0x00, 0x00, 0xb8, 0x00, 0x00, 0x00, 0x0b, 0x00, 0x00, 0x00, 0x76, 0x00, 0x00, 0x00, 0xb0, 0x00, 0x00, 0x00, 0xdc, 0x00, 0x00, 0x00, 0x02, 0x00, 0x00, 0x00, 0x51, 0x00, 0x00, 0x00 ]
enc=[0]*32
key2=[ 0xd6, 0x90, 0xe9, 0xfe, 0xcc, 0xe1, 0x3d, 0xb7, 0x16, 0xb6, 0x14, 0xc2, 0x28, 0xfb, 0x2c, 0x05, 0x2b, 0x67, 0x9a, 0x76, 0x2a, 0xbe, 0x04, 0xc3, 0xaa, 0x44, 0x13, 0x26, 0x49, 0x86, 0x06, 0x99, 0x9c, 0x42, 0x50, 0xf4, 0x91, 0xef, 0x98, 0x7a, 0x33, 0x54, 0x0b, 0x43, 0xed, 0xcf, 0xac, 0x62, 0xe4, 0xb3, 0x1c, 0xa9, 0xc9, 0x08, 0xe8, 0x95, 0x80, 0xdf, 0x94, 0xfa, 0x75, 0x8f, 0x3f, 0xa6, 0x47, 0x07, 0xa7, 0xfc, 0xf3, 0x73, 0x17, 0xba, 0x83, 0x59, 0x3c, 0x19, 0xe6, 0x85, 0x4f, 0xa8, 0x68, 0x6b, 0x81, 0xb2, 0x71, 0x64, 0xda, 0x8b, 0xf8, 0xeb, 0x0f, 0x4b, 0x70, 0x56, 0x9d, 0x35, 0x1e, 0x24, 0x0e, 0x5e, 0x63, 0x58, 0xd1, 0xa2, 0x25, 0x22, 0x7c, 0x3b, 0x01, 0x21, 0x78, 0x87, 0xd4, 0x00, 0x46, 0x57, 0x9f, 0xd3, 0x27, 0x52, 0x4c, 0x36, 0x02, 0xe7, 0xa0, 0xc4, 0xc8, 0x9e, 0xea, 0xbf, 0x8a, 0xd2, 0x40, 0xc7, 0x38, 0xb5, 0xa3, 0xf7, 0xf2, 0xce, 0xf9, 0x61, 0x15, 0xa1, 0xe0, 0xae, 0x5d, 0xa4, 0x9b, 0x34, 0x1a, 0x55, 0xad, 0x93, 0x32, 0x30, 0xf5, 0x8c, 0xb1, 0xe3, 0x1d, 0xf6, 0xe2, 0x2e, 0x82, 0x66, 0xca, 0x60, 0xc0, 0x29, 0x23, 0xab, 0x0d, 0x53, 0x4e, 0x6f, 0xd5, 0xdb, 0x37, 0x45, 0xde, 0xfd, 0x8e, 0x2f, 0x03, 0xff, 0x6a, 0x72, 0x6d, 0x6c, 0x5b, 0x51, 0x8d, 0x1b, 0xaf, 0x92, 0xbb, 0xdd, 0xbc, 0x7f, 0x11, 0xd9, 0x5c, 0x41, 0x1f, 0x10, 0x5a, 0xd8, 0x0a, 0xc1, 0x31, 0x88, 0xa5, 0xcd, 0x7b, 0xbd, 0x2d, 0x74, 0xd0, 0x12, 0xb8, 0xe5, 0xb4, 0xb0, 0x89, 0x69, 0x97, 0x4a, 0x0c, 0x96, 0x77, 0x7e, 0x65, 0xb9, 0xf1, 0x09, 0xc5, 0x6e, 0xc6, 0x84, 0x18, 0xf0, 0x7d, 0xec, 0x3a, 0xdc, 0x4d, 0x20, 0x79, 0xee, 0x5f, 0x3e, 0xd7, 0xcb, 0x39, 0x48 ]
key2_xor=[ 0x63, 0x7c, 0x77, 0x7b, 0xf2, 0x6b, 0x6f, 0xc5, 0x30, 0x01, 0x67, 0x2b, 0xfe, 0xd7, 0xab, 0x76, 0xca, 0x82, 0xc9, 0x7d, 0xfa, 0x59, 0x47, 0xf0, 0xad, 0xd4, 0xa2, 0xaf, 0x9c, 0xa4, 0x72, 0xc0, 0xb7, 0xfd, 0x93, 0x26, 0x36, 0x3f, 0xf7, 0xcc, 0x34, 0xa5, 0xe5, 0xf1, 0x71, 0xd8, 0x31, 0x15, 0x04, 0xc7, 0x23, 0xc3, 0x18, 0x96, 0x05, 0x9a, 0x07, 0x12, 0x80, 0xe2, 0xeb, 0x27, 0xb2, 0x75, 0x09, 0x83, 0x2c, 0x1a, 0x1b, 0x6e, 0x5a, 0xa0, 0x52, 0x3b, 0xd6, 0xb3, 0x29, 0xe3, 0x2f, 0x84, 0x53, 0xd1, 0x00, 0xed, 0x20, 0xfc, 0xb1, 0x5b, 0x6a, 0xcb, 0xbe, 0x39, 0x4a, 0x4c, 0x58, 0xcf, 0xd0, 0xef, 0xaa, 0xfb, 0x43, 0x4d, 0x33, 0x85, 0x45, 0xf9, 0x02, 0x7f, 0x50, 0x3c, 0x9f, 0xa8, 0x51, 0xa3, 0x40, 0x8f, 0x92, 0x9d, 0x38, 0xf5, 0xbc, 0xb6, 0xda, 0x21, 0x10, 0xff, 0xf3, 0xd2, 0xcd, 0x0c, 0x13, 0xec, 0x5f, 0x97, 0x44, 0x17, 0xc4, 0xa7, 0x7e, 0x3d, 0x64, 0x5d, 0x19, 0x73, 0x60, 0x81, 0x4f, 0xdc, 0x22, 0x2a, 0x90, 0x88, 0x46, 0xee, 0xb8, 0x14, 0xde, 0x5e, 0x0b, 0xdb, 0xe0, 0x32, 0x3a, 0x0a, 0x49, 0x06, 0x24, 0x5c, 0xc2, 0xd3, 0xac, 0x62, 0x91, 0x95, 0xe4, 0x79, 0xe7, 0xc8, 0x37, 0x6d, 0x8d, 0xd5, 0x4e, 0xa9, 0x6c, 0x56, 0xf4, 0xea, 0x65, 0x7a, 0xae, 0x08, 0xba, 0x78, 0x25, 0x2e, 0x1c, 0xa6, 0xb4, 0xc6, 0xe8, 0xdd, 0x74, 0x1f, 0x4b, 0xbd, 0x8b, 0x8a, 0x70, 0x3e, 0xb5, 0x66, 0x48, 0x03, 0xf6, 0x0e, 0x61, 0x35, 0x57, 0xb9, 0x86, 0xc1, 0x1d, 0x9e, 0xe1, 0xf8, 0x98, 0x11, 0x69, 0xd9, 0x8e, 0x94, 0x9b, 0x1e, 0x87, 0xe9, 0xce, 0x55, 0x28, 0xdf, 0x8c, 0xa1, 0x89, 0x0d, 0xbf, 0xe6, 0x42, 0x68, 0x41, 0x99, 0x2d, 0x0f, 0xb0, 0x54, 0xbb, 0x16 ]
iRam00011200=0
for i in range(8):
    for j in range(4):
        enc[j+i*4]=a[j*4+i*0x10]
Pri_key="TGCTF404"
key=[]
for i in Pri_key:
    key.append(ord(i)^0x51)

# 逆向加密算法，求出来乱序但字符正确的flag
for i in range(0,32,4):
    iVar1 = key[iRam00011200] >> 4
    uVar2 = key[iRam00011200] & 0xf
    iRam00011200 += 1
    param2=key2_xor[iVar1*0x10+uVar2]
    unnamed_function_10(key2,param2)
    for j in range(0,4):
        enc[j+i] ^= ord(Pri_key[j])
        enc[j+i]^=key2[iVar1 * 0x10 + j * 0x11 + uVar2]
for i in enc:
    print(chr(i),end='') # Z49H539c{--6}d4888bTUCf8NeFe--e9
```

对于乱序算法，这里有些地方要注意

![](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest/img/1747300067-image.png)

这里的unnamed\_function\_16实际上对应rand()，即随机数生成，种子前面也有，因此这里是固定排序，可以模拟

后面这个iVar2 = i + iVar2 / (0x7fffffff / (input\_len - i) + 1)在解密代码里要变成0x7fff（似乎是一种凑巧？因为如果用原始的0x7fffffff会导致iVar2与i恒等，直到逐渐减小到0x7fff才是一种正确的值，但再往下减又会出问题了）

代码如下：

```
#include <stdio.h>
#include <stdlib.h>
int main(){
    int iVar2 = 0;
    char enc[]="Z49H539c{--6}d4888bTUCf8NeFe--e9";
    srand(0x194);
    int swap[32][2];
    for (int i = 0; i < 32; i++)
    {
        iVar2 = rand();
        iVar2 = i + iVar2 / (0x7fff / (32 - i) + 1);
        swap[i][0] = i;
        swap[i][1] = iVar2;  // 将交换的两个索引存储起来，后面直接查找就可以
    }
    for (int i = 31; i >= 0; i--)
    {
        unsigned char temp = enc[swap[i][0]];
        enc[swap[i][0]] = enc[swap[i][1]]; 
        enc[swap[i][1]] = temp;
    }
    
    for (int i = 0; i < 32; i++)
    {
        printf("%c",enc[i]);
    }
    
}
```

HZNUCTF{f898-de85-46e-9e43-b9c8}

磕磕绊绊一个月才复现完......感觉是挺好的比赛，学到挺多东西了