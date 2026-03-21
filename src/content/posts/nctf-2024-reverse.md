---
title: NCTF2024 reverse WriteUp
published: 2025-03-28 11:07:39
description: NCTF2024 writeup
pinned: false
tags: [CTF,reverse]
category: ctfWriteup
---


接触ctf之后好好打的第一个正式的比赛，难哭了

只写出来两道逆向，但狗运还行（校内大佬基本都组一起了），拿了校内第三

## ezDOS

查⼀下，16位dos程序，win11打不开，但ida可以分析

怼着汇编看了半天，这⾥有个很典型的花指令（看到这个call有点莫名其妙，感觉是花指令，nop⼀下发现猜想是对的）

![](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest/img/1743129721-image.png)

还有⼏处这样的，全nop掉后再分析

是⼀个输⼊->加密->校验的过程，加密后的密⽂硬编码在142h到167h之间

但这⾥⾯对密钥好像做了⼀些加密（deepseek说是魔改的rc4）

汇编水平太差。。。有点看不明白这个逻辑

但RC4最后就是将密钥流和原文逐字节异或，那我直接提取出来密钥流不就⾏了吗？

![](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest/img/1743129763-image.png)

也就是找到上图这个时候的al的值

可以用dosbox调试16位程序

先导入程序进dosbox

![](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest/img/1743129819-image.png)

debug调试即可

需要注意，原程序里面有花指令，dos中一步步执行时会遇到这些花指令，不能让dos运行这些错误的汇编指令，这里要修改为正确的汇编指令，否则动态调试得出来的al的值会错

我先在ida⾥⾯看我修改花指令之后对应区域的机器码，然后在dosbox⾥⾯⽤-e命令⼀个个修改（懒得截图了）

这里还有个坑就是，当提示输入的时候，输入的字符串长度必须要等于flag的长度，否则验证逻辑走不完，没法完全提取出al的值（我就错了一次，又得重头再调一遍，极其痛苦）

做题的时候我真的循环执行了几十遍⼀个个提取al的值，现在不想再搞⼀次了（）

```
a=[0x32,0x7d,0x59,0x7a,0xf3,0x0d,0xb3,0x7b,0x64,0x8c,0xeb,0x28,0xc4,0xa4,0x50,0x30,0xa0,0xed,0x27,0x6a,0xe3,0x76,0x69,0xc,0xda,0x28,0xf8,0x8,0xba,0xa6,0x17,0x3e,0x12,0x59,0x45,0x6,0x4e,0xf1]
enc=[ 0x7C, 0x3E, 0x0D, 0x3C, 0x88, 0x54, 0x83, 0x0E, 0x3B,
  0xB8, 0x99, 0x1B, 0x9B, 0xE5, 0x23, 0x43, 0xC5, 0x80, 0x45,
  0x5B, 0x9A, 0x29, 0x24, 0x38, 0xA9, 0x5C, 0xCB, 0x7A, 0xE5,
  0x93, 0x73, 0x0E, 0x70, 0x6D, 0x7C, 0x31, 0x2B, 0x8C]
for i in range(len(a)):
    print(chr(a[i]^enc[i]),end='')

# NCTF{Y0u_4r3_Assemb1y_M4st3r_5d0b497e}
```

## SafeProgram

64位无壳，直接ida分析

和上题一样的输入->加密->验证逻辑，密文也直接硬编码在内存里

![](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest/img/1743130268-image-1024x458.png)

sub\_1400019D0函数这一大串加密是个SM4，每次传入16个字符原文，分两次加密flag前后16个字符

密钥也在程序里面

![](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest/img/1743130417-image.png)

做题的时候感觉应该没这么简单，cyberchef了一下，答案果然是错的

那就动态调试试试

但是在main函数开头下断点，会报错并无法继续调试

![](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest/img/1743130488-image.png)

应该是某种反调试，那就在\_\_scrt\_common\_main\_seh开头下断点看看

这里还有个问题，即使在\_\_scrt\_common\_main\_seh开头下了断点，main函数内也不能有断点，否则还是会出现上述warning（试了几次都这样）

那就只在\_\_scrt\_common\_main\_seh开头下断点，继续调试

这个时候可以正常进入main函数，没有出现warning

按要求输入一个长度为38的字符串，进入到加密逻辑

![](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest/img/1743130718-image-1024x331.png)

这里我试过很多次，用汇编窗口分析更好一点

![](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest/img/1743130803-image-1024x269.png)

这里有个除0异常，做题的时候我其实误打误撞的，没怎么在乎，但赛后看到其它大佬的wp，这里应该调用了这个函数：

![](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest/img/1743130857-image-1024x331.png)

把上面的密钥更改了

![](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest/img/1743130883-image-1024x331.png)

同时更改了SM4加密的S盒

![](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest/img/1743130929-image-1024x331.png)

自己在比赛的时候其实还不是太熟悉SM4，这里调了一段时间，重试了很多次，最后误打误撞才发现这两处地方似乎被修改了，然后去了解了一下SM4，才知道这个情况

知道这些信息，从网上抄了一份原生的SM4加密，再手动修改S盒以及密钥，分两次解密密文的前后16个字符即可

```
from pydoc import plaintext

S_BOX = [0xD1, 0x90, 0xE9, 0xFE, 0xCC, 0xE1, 0x3D, 0xB7, 0x16, 0xB6, 0x14, 0xC2, 0x28, 0xFB, 0x2C, 0x05, 0x2B, 0x67,
         0x9A, 0x76, 0x2A, 0xBE, 0x04, 0xC3, 0xAA, 0x44, 0x13, 0x26, 0x49, 0x86, 0x06, 0x99, 0x9C, 0x42, 0x50, 0xF4,
         0x91, 0xEF, 0x98, 0x7A, 0x33, 0x54, 0x0B, 0x43, 0xED, 0xCF, 0xAC, 0x62, 0xE4, 0xB3, 0x17, 0xA9, 0x1C, 0x08,
         0xE8, 0x95, 0x80, 0xDF, 0x94, 0xFA, 0x75, 0x8F, 0x3F, 0xA6, 0x47, 0x07, 0xA7, 0x4F, 0xF3, 0x73, 0x71, 0xBA,
         0x83, 0x59, 0x3C, 0x19, 0xE6, 0x85, 0xD6, 0xA8, 0x68, 0x6B, 0x81, 0xB2, 0xFC, 0x64, 0xDA, 0x8B, 0xF8, 0xEB,
         0x0F, 0x4B, 0x70, 0x56, 0x9D, 0x35, 0x1E, 0x24, 0x0E, 0x78, 0x63, 0x58, 0x9F, 0xA2, 0x25, 0x22, 0x7C, 0x3B,
         0x01, 0x21, 0xC9, 0x87, 0xD4, 0x00, 0x46, 0x57, 0x5E, 0xD3, 0x27, 0x52, 0x4C, 0x36, 0x02, 0xE7, 0xA0, 0xC4,
         0xC8, 0x9E, 0xEA, 0xBF, 0x8A, 0xD2, 0x40, 0xC7, 0x38, 0xB5, 0xA3, 0xF7, 0xF2, 0xCE, 0xF9, 0x61, 0x15, 0xA1,
         0xE0, 0xAE, 0x5D, 0xA4, 0x9B, 0x34, 0x1A, 0x55, 0xAD, 0x93, 0x32, 0x30, 0xF5, 0x8C, 0xB1, 0xE3, 0x1D, 0xF6,
         0xE2, 0x2E, 0x82, 0x66, 0xCA, 0x60, 0xC0, 0x29, 0x23, 0xAB, 0x0D, 0x53, 0x4E, 0x6F, 0xD5, 0xDB, 0x37, 0x45,
         0xDE, 0xFD, 0x8E, 0x2F, 0x03, 0xFF, 0x6A, 0x72, 0x6D, 0x6C, 0x5B, 0x51, 0x8D, 0x1B, 0xAF, 0x92, 0xBB, 0xDD,
         0xBC, 0x7F, 0x11, 0xD9, 0x5C, 0x41, 0x1F, 0x10, 0x5A, 0xD8, 0x0A, 0xC1, 0x31, 0x88, 0xA5, 0xCD, 0x7B, 0xBD,
         0x2D, 0x74, 0xD0, 0x12, 0xB8, 0xE5, 0xB4, 0xB0, 0x89, 0x69, 0x97, 0x4A, 0x0C, 0x96, 0x77, 0x7E, 0x65, 0xB9,
         0xF1, 0x09, 0xC5, 0x6E, 0xC6, 0x84, 0x18, 0xF0, 0x7D, 0xEC, 0x3A, 0xDC, 0x4D, 0x20, 0x79, 0xEE, 0x5F, 0x3E,
         0xD7, 0xCB, 0x39, 0x48
         ]

FK = [0xa3b1bac6, 0x56aa3350, 0x677d9197, 0xb27022dc]
CK = [
    0x00070e15, 0x1c232a31, 0x383f464d, 0x545b6269,
    0x70777e85, 0x8c939aa1, 0xa8afb6bd, 0xc4cbd2d9,
    0xe0e7eef5, 0xfc030a11, 0x181f262d, 0x343b4249,
    0x50575e65, 0x6c737a81, 0x888f969d, 0xa4abb2b9,
    0xc0c7ced5, 0xdce3eaf1, 0xf8ff060d, 0x141b2229,
    0x30373e45, 0x4c535a61, 0x686f767d, 0x848b9299,
    0xa0a7aeb5, 0xbcc3cad1, 0xd8dfe6ed, 0xf4fb0209,
    0x10171e25, 0x2c333a41, 0x484f565d, 0x646b7279
]


def wd_to_byte(wd, bys):
    bys.extend([(wd >> i) & 0xff for i in range(24, -1, -8)])


def bys_to_wd(bys):
    ret = 0
    for i in range(4):
        bits = 24 - i * 8
        ret = (bys[i] << bits)
    return ret


def s_box(wd):
    """
    进行非线性变换，查S盒
    :param wd: 输入一个32bits字
    :return: 返回一个32bits字   ->int
    """
    ret = []
    for i in range(0, 4):
        byte = (wd >> (24 - i * 8)) & 0xff
        row = byte >> 4
        col = byte & 0x0f
        index = (row * 16 + col)
        ret.append(S_BOX[index])
    return bys_to_wd(ret)


def rotate_left(wd, bit):
    """
    :param wd: 待移位的字
    :param bit: 循环左移位数
    :return:
    """
    return (wd << bit & 0xffffffff)  (wd >> (32 - bit))


def Linear_transformation(wd):
    """
    进行线性变换L
    :param wd: 32bits输入
    """
    return wd ^ rotate_left(wd, 2) ^ rotate_left(wd, 10) ^ rotate_left(wd, 18) ^ rotate_left(wd, 24)


def Tx(k1, k2, k3, ck):
    """
    密钥扩展算法的合成变换
    """
    xor = k1 ^ k2 ^ k3 ^ ck
    t = s_box(k1 ^ k2 ^ k3 ^ ck)
    return t ^ rotate_left(t, 13) ^ rotate_left(t, 23)


def T(x1, x2, x3, rk):
    """
    加密算法轮函数的合成变换
    """
    t = x1 ^ x2 ^ x3 ^ rk
    t = s_box(t)
    return t ^ rotate_left(t, 2) ^ rotate_left(t, 10) ^ rotate_left(t, 18) ^ rotate_left(t, 24)


def key_extend(main_key):
    MK = [(main_key >> (128 - (i + 1) * 32)) & 0xffffffff for i in range(4)]
    # 将128bits分为4个字
    keys = [FK[i] ^ MK[i] for i in range(4)]
    # 生成K0~K3
    RK = []
    for i in range(32):
        t = Tx(keys[i + 1], keys[i + 2], keys[i + 3], CK[i])
        k = keys[i] ^ t
        keys.append(k)
        RK.append(k)
    return RK


def R(x0, x1, x2, x3):
    # 使用位运算符将数值限制在32位范围内
    x0 &= 0xffffffff
    x1 &= 0xffffffff
    x2 &= 0xffffffff
    x3 &= 0xffffffff
    s = f"{x3:08x}{x2:08x}{x1:08x}{x0:08x}"
    return s


def encode(plaintext, rk):
    X = [plaintext >> (128 - (i + 1) * 32) & 0xffffffff for i in range(4)]
    for i in range(32):
        t = T(X[1], X[2], X[3], rk[i])
        c = (t ^ X[0])
        X = X[1:] + [c]
    ciphertext = R(X[0], X[1], X[2], X[3])
    # 进行反序处理
    return ciphertext


def decode(ciphertext, rk):
    # ciphertext = int(ciphertext, 16)
    X = [ciphertext >> (128 - (i + 1) * 32) & 0xffffffff for i in range(4)]
    for i in range(32):
        t = T(X[1], X[2], X[3], rk[31 - i])
        c = (t ^ X[0])
        X = X[1:] + [c]
    m = R(X[0], X[1], X[2], X[3])
    return m


def output(s, name):
    out = ""
    for i in range(0, len(s), 2):
        out += s[i:i + 2] + " "
    print(f"{name}:", end="")
    print(out.strip())


if __name__ == '__main__':
    # plaintext1 = 0xfb973c3bf19912df1330f7d87feba06c
    plaintext1 = 0x145ba62aa805a5f376bec901f9367b46
    main_key = 0x4e43544632346e6374664e4354463234
    rk1 = key_extend(main_key)
    m = decode(plaintext1, rk1)
    output(m, "plaintext1")
```

输出的十六进制手动转一下就好了

NCTF{58cb925e0cd823c0d0b54fd06b820b7e}

## gogo（复现）

极其逆天

go+虚拟机逆向+多线程，给萌新难傻了，比赛第二天做了8个多小时，只发现了虚拟机的opcode，实在没精力再去研究怎么还原出汇编代码，就放弃了

用ida打开，go语言逆向会损失函数的符号而找不到main函数，这里我找到了一个插件可以一键恢复符号

> [0xjiayu/go\_parser: Yet Another Golang binary parser for IDAPro](https://github.com/0xjiayu/go_parser)

恢复后就可以找到main函数main\_main了

![](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest/img/1743297844-image-1024x373.png)

没怎么接触过go，查了半天资料了解了一下，它里面的很多字符串的特性以及函数的调用都和其它语言有挺大差距的，一些常见的像print这样的函数长得比较奇怪，不过ida整体反汇编出来的代码和c其实相差不大，看不懂可以动态调试

![](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest/img/1743298386-image-1024x458.png)

这个区域开始就是加密的主要逻辑

这道题的程序是多线程，动态调试的时候会在两个线程之间来回跳转，但这里不能被这些东西吓到

![](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest/img/1743298471-image.png)

经过一阵折腾找到了这个函数，其实这个加密逻辑就是把40个字符的flag按前后分成20个字符，分两个线程并发地加密（这里我的代码对某些有意义的值重命名过）

具体加密逻辑就是执行虚拟机指令的过程

而虚拟机操作码的获取可以结合动态调试，会跟踪到main\_map\_init\_0和main\_map\_init\_1两个函数，这里就分别是对flag前后20个字符的加密的操作码（两个线程的虚拟机的指令对应的操作码不一样）

比较搞笑的是这里我在做题的时候居然提取错了.....我的提取是这样的：

对于前20个字符：  
LDR:0x12  
LDRI:0x15  
STR:0x16  
STRI:0x2A  
MOV:0x41  
ADD:0x42  
SUB:0x47  
MUL:0x71  
LSL:0x73  
LSR:0x7A  
XOR:0x7B  
AND:0xFE  
RET:0xFF  

对于后20个字符：  
LDR:0x14  
LDRI:0x17  
STR:0x18  
STRI:0x2B  
MOV:0x91  
ADD:0x92  
SUB:0x97  
MUL:0xC1  
LSL:0xC3  
LSR:0xCA  
XOR:0xCB  
AND:0xFE  
RET:0xFF  

正确的是（官方的wp）：  
var instructionSetA = map\[byte\]handler{  
0x11: LDR,  
0x12: LDRI,  
0x15: STR,  
0x16: STRI,  
0x2A: MOV,  
0x41: ADD,  
0x42: SUB,  
0x47: MUL,  
0x71: LSL,  
0x73: LSR,  
0x7A: XOR,  
0x7B: AND,  
0xFE: RET,  
0xFF: HLT,  
}  
var instructionSetB = map\[byte\]handler{  
0x13: LDR,  
0x14: LDRI,  
0x17: STR,  
0x18: STRI,  
0x2B: MOV,  
0x91: ADD,  
0x92: SUB,  
0x97: MUL,  
0xC1: LSL,  
0xC3: LSR,  
0xCA: XOR,  
0xCB: AND,  
0xFE: RET,  
0xFF: HLT,  
}  

那么现在的问题就变得很简单（?），就是根据opcode对应的操作码映射为汇编代码，这样就可以分析了，由于是两个线程并发进行且它们共用一个opcode，因此可以分开讨论，把两个线程分开解析，这样不容易搞混  
我做题的时候就卡在这一步了，因为正常的opcode应该是这样的（hgame2023 vm）：

![](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest/img/1743299283-image.png)

也就是说，opcode里面的每一个字节，对应着一个指令或不进行操作，并且可以很方便地创建结构体，以便于看出汇编指令所操作的各寄存器

> [\[原创\]VM逆向，一篇就够了（上）-CTF对抗-看雪-安全社区安全招聘kanxue.com](https://bbs.kanxue.com/thread-281119.htm#msg_header_h3_6)

但这道题我真的无从下手，不知道怎么创建结构体。同时，opcode是四个字节为一个单位进行操作而且19444字节的opcode体量庞大， 确实把我吓到了，不知如何解析，到这里我已经看这道题近8个小时了（于是我就放弃这道题然后出去打舞萌了233）

赛后看了官方的wp，其实很容易理解，这个opcode以四个字节为单位执行一个汇编语言，那么根据这些汇编语言的语法，四个字节都可以很容易地找到它们的含义是什么

![](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest/img/1743300509-image-1024x466.png)

以第一块为例，‘2A’对应init\_0的mov指令，‘0’对应寄存器（这里分析了一下，发现有好几个寄存器，分别以0，1，2，3.....来表示，这里是R0），后面的‘37’、‘9e’对应的就是操作数，于是这段指令就可以翻译为：

mov,R0,9e37

对于某些指令（如ADD、LSL等）后三个字节都是寄存器，推测应该是前两个寄存器当成了一个来用

那么就可以分析了：

注意到0x9e3779b9是tea算法的典型数据，可以猜测是tea或xxtea等变种（没猜测到也不要紧，可以看导出来的汇编），手搓一下代码先

对于init\_0：

```
#include<stdio.h>
int main()
{
    unsigned char opcode[19444] = {
      0x2A, 0x00, 0x37, 0x9E, 0x2A, 0x01, 0xB9, 0x79, 0x2B, 0x00,
      0x37, 0x9E, 0x2A, 0x02, 0x10, 0x00, 0x71, 0x03, 0x00, 0x02,
      0x2B, 0x01, 0xB9, 0x79, 0x2B, 0x02, 0x10, 0x00, 0x41, 0x01,
      0x01, 0x03, 0x16, 0x01, 0x00, 0x1C, 0x2A, 0x00, 0x00, 0x00,
      ......}; // 这里没放完19444个opcode字节
    for (int i = 0; i < 19444; i+=4)
    {
      switch (opcode[i])
      {
      case 0x2A:
        printf("mov,R%d,%x%x\n",opcode[i+1],opcode[i+3],opcode[i+2]);
        break;
      case 0x41:
        printf("add,R%d,R%d,R%d\n",opcode[i+1],opcode[i+2],opcode[i+3]);
        break;
      case 0x42:
        printf("sub,R%d,R%d,R%d\n",opcode[i+1],opcode[i+2],opcode[i+3]);
        break;
      case 0x47:
        printf("mul,R%d,R%d,R%d\n",opcode[i+1],opcode[i+2],opcode[i+3]);
        break;
      case 0x71:
        printf("LSL,R%d,R%d,R%d\n",opcode[i+1],opcode[i+2],opcode[i+3]);
        break;
      case 0x73:
        printf("LSR,R%d,R%d,R%d\n",opcode[i+1],opcode[i+2],opcode[i+3]);
        break;
      case 0x7A:
        printf("xor,R%d,R%d,R%d\n",opcode[i+1],opcode[i+2],opcode[i+3]);
        break;
      default:
        break;
      }
    }
    printf("over");
    return 0;
  }
```

init\_1和上面一样，改一下操作码即可

这里我没有写STR，LSR等指令，因为全写出来也看不太明白，而且这些指令对加密逻辑的判断用处不大

跑出来可以看到，init\_0就是很标准的XXTEA，没有魔改，但init\_1稍微修改了一下，把代码中的“左移”和“右移”互换了（表达不太清晰，下面放代码）

密钥也在代码执行后得到的汇编指令里面，找出来就行

有关密钥提取，这里有一个需要注意的地方（笨比自己看半天没明白，问了一下出题的学长才知道）

以init\_0生成的汇编指令为例，可以看到生成的大致是这样的指令：

```
mov,R0,9e37
mov,R1,79b9
mov,R2,0010
LSL,R3,R0,R2
add,R1,R1,R3
mov,R0,0000
mov,R14,0000
mov,R0,0002
mov,R15,0005
LSL,R4,R2,R0
LSR,R5,R3,R15
xor,R6,R4,R5
mov,R0,0003
mov,R15,0004
LSR,R4,R2,R0
LSL,R5,R3,R15
xor,R7,R4,R5
add,R8,R6,R7
mov,R4,a78c
mov,R5,0b4f
mov,R15,0010
LSL,R6,R4,R15
add,R5,R5,R6
mov,R15,0002
LSR,R9,R1,R15
xor,R4,R13,R14
mov,R12,0004
mul,R4,R4,R12
mov,R15,0020
add,R10,R4,R15
xor,R6,R1,R2
xor,R7,R3,R4
add,R9,R6,R7
xor,R10,R8,R9
mov,R4,6e63
mov,R5,7466
mov,R15,0010
LSL,R6,R4,R15
add,R5,R5,R6
add,R12,R10,R11
mov,R0,0001
add,R14,R14,R0
mov,R4,062e
mov,R5,f0ed
mov,R15,0010
LSL,R6,R4,R15
add,R5,R5,R6
mov,R0,0002
mov,R15,0005
LSL,R4,R2,R0
LSR,R5,R3,R15
xor,R6,R4,R5
mov,R0,0003
mov,R15,0004
LSR,R4,R2,R0
LSL,R5,R3,R15
xor,R7,R4,R5
add,R8,R6,R7
mov,R4,3230
mov,R5,3234
```

这里可以看到密钥出现的先后顺序是0xa78c0b4f,0x6e637466,0x062ef0ed,0x32303234

但密钥的实际顺序是0x6e637466, 0x062ef0ed,0xa78c0b4f, 0x32303234

这里的原因是，汇编指令中出现的先后顺序是密钥的调用顺序，而不是它原本的顺序

具体来说，在进行加密的时候，对key的索引为：(p&3)^e，而在加密的第一轮中，p=0，e=（0x9e3779b9>>2)&3=2，因此p^e=2

得出第一个调用数据实际上是key\[2\]

以此类推得出key的原本顺序

结合下面的代码来想会好理解一点

这是前20个字节的解密流程（未魔改xxtea）：

```
#include <stdio.h>
#include <stdint.h>
#define DELTA 0x9e3779b9
#define MX (((z>>5^y<<2) + (y>>3^z<<4)) ^ ((sum^y) + (key[(p&3)^e] ^ z)))
 
void btea(uint32_t *v, int n, uint32_t const key[4])
{
    uint32_t y, z, sum;
    unsigned p, rounds, e;
    if (n > 1)            /* Coding Part */
    {
        rounds = 6 + 52/n;
        sum = 0;
        z = v[n-1];
        do
        {
            sum += DELTA;
            e = (sum >> 2) & 3;
            for (p=0; p<n-1; p++)
            {
                y = v[p+1];
                z = v[p] += MX;
            }
            y = v[0];
            z = v[n-1] += MX;
        }
        while (--rounds);
    }
    else if (n < -1)      /* Decoding Part */
    {
        n = -n;
        rounds = 6 + 52/n;
        sum = rounds*DELTA;
        y = v[0];
        do
        {
            e = (sum >> 2) & 3;
            for (p=n-1; p>0; p--)
            {
                z = v[p-1];
                y = v[p] -= MX;
            }
            z = v[n-1];
            y = v[0] -= MX;
            sum -= DELTA;
        }
        while (--rounds);
    }
}
 
 
int main()
{
    uint32_t v[5]= {0xB9D5455D, 0x389C958C, 0x1E3EB13B, 0xBBE8C85F, 0x69483864};
    uint32_t const k[4]= {0x6e637466, 0x062ef0ed, 0xa78c0b4f, 0x32303234};
    int n= 5;
    btea(v, -n, k);
    printf("0x%x,0x%x,0x%x,0x%x,0x%x\n",v[0],v[1],v[2],v[3],v[4]);
    return 0;
}
```

这是后20个字节的解密流程（魔改的xxtea）：

```
#include <stdio.h>
#include <stdint.h>
#define DELTA 0x9e3779b9
#define MX (((z<<5^y>>2) + (y<<3^z>>4)) ^ ((sum^y) + (key[(p&3)^e] ^ z)))
// 这里有修改
void btea(uint32_t *v, int n, uint32_t const key[4])
{
    uint32_t y, z, sum;
    unsigned p, rounds, e;
    if (n > 1)            /* Coding Part */
    {
        rounds = 6 + 52/n;
        sum = 0;
        z = v[n-1];
        do
        {
            sum += DELTA;
            e = (sum >> 2) & 3;
            for (p=0; p<n-1; p++)
            {
                y = v[p+1];
                z = v[p] += MX;
            }
            y = v[0];
            z = v[n-1] += MX;
        }
        while (--rounds);
    }
    else if (n < -1)      /* Decoding Part */
    {
        n = -n;
        rounds = 6 + 52/n;
        sum = rounds*DELTA;
        y = v[0];
        do
        {
            e = (sum >> 2) & 3;
            for (p=n-1; p>0; p--)
            {
                z = v[p-1];
                y = v[p] -= MX;
            }
            z = v[n-1];
            y = v[0] -= MX;
            sum -= DELTA;
        }
        while (--rounds);
    }
}
 
 
int main()
{
    uint32_t v[5]= {0xADD881DE, 0x32A6C4C2, 0x3E61AB1C, 0xF1EFFFCB, 0x167A3027};
    uint32_t const k[4]= {0x32303234, 0xd6eb12c3, 0x9f1cf72e, 0x4e435446};
    int n= 5;
    btea(v, -n, k);
    printf("0x%x,0x%x,0x%x,0x%x,0x%x\n",v[0],v[1],v[2],v[3],v[4]);
    return 0;
}
```

得到的数据转成字符即可

```
a=[0x4654434e,0x7234487b,0x4d565f64,0x7469775f,0x6f475f68,0x74753072,0x5f336e31,0x34636635,0x65623062,0x7d646137]
flag=b''
for i in a:
    flag+=i.to_bytes(4,'little')
print(flag)
```

NCTF{H4rd\_VM\_with\_Gor0ut1n3\_5fc4b0be7ad}

## x1Login（复现）

对安卓逆向不太熟悉，看到这道题还有反调试更是被吓晕，以为要动态调试，直接不写了

赛后复现发现其实就是因为我不熟悉安卓逆向，题目本身难度并不大

先说这个把我吓跑的反调试和反root

![](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest/img/1743339710-image.png)

这里官方题解写到“apktool解包修改smali代码，再重新签名打包。”（常规解法）

其实这个东西不管它也行，反正用不上动态调试，把模拟器root关了先进去看看

![](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest/img/1743340479-image.png)

就是输入->加密->校验的逻辑，找到username和password即可

看mainactivity，这里有挺多很像base64的加密字符串

![](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest/img/1743340555-image-1024x475.png)

但是直接拿去解密不对，那就看看这个get方法干了什么

![](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest/img/1743340605-image.png)

这就很像windows系统上面的DLL文件，是动态载入的，只不过在安卓系统上是so文件

将apk文件解压，在lib文件夹里找到libsimple.so文件，这个是ELF文件头，可以直接用ida分析

在导出表可以找到get方法并找出加密逻辑

就是先进行换表base64，再将得到的明文异或于它的长度

把上面那个解密，得到

![](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest/img/1743340822-image-1024x421.png)

这显然是一个方法名，但是在jadx里面找不到，而且目前也没有看到我们在程序中输入错误用户名和密码时的错误输出：“Login Failed”，推测应该还有一个so文件被动态载入了

在onCreate方法里面继续往下看（感觉这个有点像一般windows逆向的main函数），找到getclass方法

这个方法调用了Secure类，在反调试和反root里面也调用了这个，看一下这个类里面有什么东西

![](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest/img/1743341050-image-1024x542.png)

这里的密文解密出来是native，lib里面还有另一个so文件就是native，是在执行

InMemoryDexClassLoader(ByteBuffer.wrap(Secure.loadDex(getApplicationContext(), DecStr.get("ygvUF2vHFgbPiN9J"))), getClassLoader()).loadClass(classname)

这条命令时动态加载的这个库，把这里的密文解密可以发现，这里又加载了一遍libsimple.so库，这有什么意义吗？

显然没有意义，因此可以合理推测，是否存在同名的libsimple.so库？

可以在asset文件夹里面发现一个同名的libsimple.so库（实际上反编译native文件，里面有指向这个库在asset文件夹的信息，但是有点难发现，感觉只能乱翻了）

这个库还埋了一个坑，它实际上不是so文件，是dex文件（丢到ida里面啥也没有），用十六进制编辑器打开可以发现有dex文件头

将dex头前面的字节全部删掉，再修改后缀为dex，丢入jadx分析

![](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest/img/1743341530-image-1024x680.png)

有前面出现的check方法和一些提示信息，这里就是程序以及加密执行的主要逻辑

用户名可以直接由uZPOs29goMu6l38=解密得出：X1c@dM1n1$t

将解密得到的用户名md5加密作为密钥，和密码原文一起放入docheck函数，这个函数位于secure类下

可以在反编译的native库中找到这个函数的实现，就是一个3DES加密，没有魔改（出题人还没这么坏）

加密后的密码也硬编码在内存里了

![](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest/img/1743341739-image.png)

直接cyberchef解密就行

![](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest/img/1743341757-image-1024x418.png)

↑这个图是错的，笨比后来才发现，这里需要注意一个坑，原程序的3DES使用的是分三次DES算法，即加密->解密->加密的过程（两次加密密钥相同），因此所用的密钥和生成的密文严格遵守小端序

**NCTF{X1c@dM1n1\\$t\_SafePWD~5y\\$x?YM+5U05Gm6=}**