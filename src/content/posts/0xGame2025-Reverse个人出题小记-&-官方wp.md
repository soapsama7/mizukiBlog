---
title: 0xGame2025 Reverse个人出题小记 & 官方wp
published: 2025-11-3 12:24:26
pinned: false
description: 对第一次出题的一点体悟和反思
tags: [reverse, 0xGame2025,CTF]
category: ctfWriteup
draft: false
---


第一次也是最后一次作为出题者和管理员的身份参与比赛，办完0x之后就差不多退役了（

因为是新生赛，所以希望我出的题能对各位新生师傅起到引导学习的作用。由于是跟同队的Spreng和1n1t学长一起出的，所以这里只有我出的相关题目

## Week1

### SignIn

IDA SHIFT+F12查看字符串即可

![image-20251103210843793](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest//post/202511032108934.png)

因为字符串是硬编码在程序内部，因此用记事本、winhex等文本编辑工具其实也能看（



### EasyXor

一般遇到不认识的文件，先扔到DIE或者其它的文件查询工具里面查查看

![image-20251103210933579](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest//post/202511032109694.png)

这里可以看到是ELF文件，什么是ELF文件可以在网上搜搜，总之IDA也可以分析它

进来之后就是一个简单的异或，属于位运算的一种，位运算在加密、编码等领域几乎必用，逆向里面也是常客。异或属于可逆运算，跟题目的反着来计算就可以

```python
enc=[0x42,0x1A,0x39,0x17,0x1D,0x9,0x51,0x55,0x2C,0x5F,0x63,0xC,0xD,0x16,0x62,0x27,0x55,0x64,0x55,0x26,0x6D,0x6A,0x18,0x34,0x88,0x65,0x6E,0x1C,0x21,0x6E,0x3D,0x23,0x6A,0x25,0x6B,0x63,0x68,0x7E,0x77,0x75,0x9A,0x7D,0x39,0x43]
key = 'raputa0xGame2025'
for i in range(len(enc)):
    print(chr((enc[i]-i)^ord(key[i % len(key)])),end='')
```



### DyDebug

应该没人真的硬解吧......

丢到IDA里面看到主函数出来特别长、特别复杂一大串，其中的加密也很复杂难懂

但实际上可以注意到这里的比对是拿我们的输入去和解密出来的字符串比较，因此在程序运行的时候其实flag就在程序内部，我们要做的其实只是让程序“停”在某个位置，然后查看一下解出来的v6，这个就是flag

![image-20251103210956676](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest//post/202511032109807.png)

这里就用到IDA的动态调试，在if判断这里下一个断点，然后启动调试，查看内存即可（具体操作可以自行搜索，网上教程很多）

![image-20251103211019305](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest//post/202511032110426.png)

顺便提一嘴密钥实际上是b站的某个视频，感兴趣可以去看看（

------

这道题硬解的师傅还不少，ai好像可以很容易就解出来了，但我的目的其实是让新生学会动态调试这个很基本也很重要的技能，只有先掌握这个基本的windows动态调试，才能做week2的那个TELF的elf动态调试题目



### BaseUpx

这个程序被添加了upx壳保护，如果直接把这个程序丢到IDA里面是一堆看不懂的东西，实际上是UPX壳相关的代码。有关upx壳相关知识可以自行搜索了解，这里有个blog讲的还可以：https://blog.csdn.net/qq_43633973/article/details/102573376

总之脱壳后，再拖入ida查看就可以看到正确的代码，实际上就是一个简单的base64编码，解码即可

![image-20251103211057061](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest//post/202511032110198.png)

## Week2

### 16bit

运行一下可以发现

![image-20251107141532359](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest//post/202511071415469.png)

因为这个是16位的应用程序，是由汇编语言直接编写再编译的，现代操作系统一般都无法直接运行，但它还是二进制文件，ida可以分析，不过F5一键出伪代码就没法用了

因为代码量比较少，ai应该可以直接出答案，但希望新生们可以多看看汇编代码

这题预期有两种解法，第一种就是硬分析汇编代码，自己手动翻译成高级语言后运行一下就出来了，涉及的都是最基本的汇编语法，借助ai和搜索工具很快就可以学习

第二种是可以配置一下dosbox，直接运行这个程序就可以出flag了

![image-20251103211214472](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest//post/202511032112582.png)

dosbox相当于一个模拟器，可以在现代操作系统上面模拟出来dos环境，可以正常运行16位的程序，学汇编的话一般都会下，具体的操作流程网上也可以搜到

------

这个题是为了让新生意识到在逆向方面底层语言的重要性，从而有意识地不会过多依赖IDA的F5反编译功能，因为汇编往往才是程序的真实逻辑，有很多程序会把其逻辑隐藏到汇编里面迷惑ida



### BabyJar

JAR 文件就是一个把 Java 程序及其资源打包在一起、方便运行或分发的压缩包，有的jar文件可以像exe一样直接运行（需要下载java环境），有的则只是作为工具包

java逆向一般都是用jadx、jeb等工具，直接把文件拖进去就可以看到逻辑

![image-20251103211255017](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest//post/202511032112156.png)

如果有搞java开发的师傅，也可以把jar文件先解压，里面只有两个class字节码文件，这个是java文件编译后得到的，IDEA可以直接反编译class文件，效果还是挺好的

![image-20251103211343267](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest//post/202511032113467.png)

逻辑都很简单，反编译之后审计代码即可，解密的类如下：

```java
import java.util.Base64;

public class Decrypt {

    int key = 0x14;
    public String decrypt(String base64Text) {
        byte[] decodedBytes = Base64.getDecoder().decode(base64Text);

        byte[] decryptedBytes = new byte[decodedBytes.length];
        for (int i = 0; i < decodedBytes.length; i++) {
            byte c = decodedBytes[i];
            byte temp = (byte) (((c & 0xF0) >> 4) | ((c & 0x0F) << 4));
            decryptedBytes[i] = (byte) (temp ^ key);
        }
        return new String(decryptedBytes);
    }
}
```

-------

出这题的时候其实已经在学Java了（~~已经准备跑路了~~），就想着顺便出一个Jar题目吧，正好为week3和week4的安卓逆向做一个铺垫，先让新生看一次简单点的Java反编译代码熟悉熟悉，不至于后面遇到apk的时候会被吓到（~~其实我就是一开始很不爱做安卓逆向~~）



### TELF

似乎难到了很多新生(?) 可能是elf文件的upx标识头不太明显

upx执行脱壳逻辑的时候，会先识别一下文件内部的upx标识，也就是"upx"这个字符串，upx只有识别到了它才能认识这个upx程序，从而执行脱壳。

反之，如果人为地修改这个upx标识，让upx无法识别出来，那么脱壳就会失败，这道题就是这样。只要把被修改的字符串改回去就行了

这里要用到文件编辑工具（winhex、010editor等都可以），可以自行下载

正常的elf文件加壳后头部是这样：

![image-20251103211510119](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest//post/202511032115242.png)

可以看到右下角的"UPX"标识，而本题把它改成了"X1c"，从而导致upx自动脱壳失败

![image-20251103211525217](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest//post/202511032115332.png)

把它改回UPX再脱壳就可以了。这也是最常见、最简单的一种upx魔改。exe的文件结构和elf不同，upx标识的位置和数量等也不一样，elf文件的标识确实相对exe来说更加隐蔽，而且比较少见

正常脱壳后就可以用ida分析了，但这道题实际上还有一个小细节

![image-20251103211542944](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest//post/202511032115041.png)

这里可以注意到，密钥是动态生成的，若需要得到密钥则需要动态调试，但本题是elf文件，动态调试需要远程挂linux（具体操作可以自行搜索学习）

有的师傅可能做过相关题目，觉得动态调试有点麻烦，因此直接在本地windows的编译器里面设置相同的种子，然后模拟出随机数列得到密钥，最后发现密钥不对

这是因为windows和linux两个系统对于随机数的生成逻辑不太一样，这个程序是在linux中运行的，所以在windows系统无法模拟出来正确的密钥顺序，必须要在linux中运行才可以得到正确的密钥

知道这些之后审计代码分析即可，就是一个简单的tea加密，解密代码如下：

```cpp
#include <stdio.h>
#include <stdint.h>
#include <stdlib.h>
#include <string.h>

#define DELTA 0x9e3779b9

void decrypt(uint32_t* v, uint32_t* k) {
    uint32_t v0 = v[0], v1 = v[1];
    uint32_t sum = DELTA*32;
    for (int i = 0; i < 32; i++) {
        v1 -= ((v0 << 4) + k[2]) ^ (v0 + sum) ^ ((v0 >> 5) + k[3]);
        v0 -= ((v1 << 4) + k[0]) ^ (v1 + sum) ^ ((v1 >> 5) + k[1]);
        sum -= DELTA;
    }
    v[0] = v0;
    v[1] = v1;
}

int main(){
    uint32_t key[4] = {0x7E4D087B,0x7A4DB733,0x70FE9DF0,0x595607F7};
    uint8_t enc[56] = {
    0xAD, 0xDA, 0x01, 0xDC, 0xAE, 0x5B, 0x8A, 0x08, 
    0x4E, 0xF5, 0x4F, 0x8F, 0x6E, 0x5F, 0x9D, 0x9E, 
    0x0A, 0x4E, 0xA9, 0x08, 0x25, 0xAB, 0x45, 0xC2, 
    0x4B, 0xC9, 0x8F, 0x43, 0x3D, 0x51, 0xD6, 0x28, 
    0xF6, 0x72, 0xCD, 0xF4, 0x2B, 0xB4, 0x4A, 0x3B, 
    0xFB, 0x36, 0x66, 0xEF, 0xD6, 0x8A, 0x8C, 0xB2, 
    0xEB, 0x1A, 0x9C, 0x1B, 0x0A, 0x9C, 0x1F, 0x53
};

    for (int i = 0; i < 56; i += 8) {
        uint32_t v[2];
        memcpy(&v, enc + i, 8);
        decrypt(v, key);
        memcpy(enc + i, &v, 8);
    }

    for (int i = 0; i < 56; i++)
    {
        printf("%c",enc[i]);
    }
    
    return 0;
}
```

顺便给出题目源码（需要在linux下运行）

```cpp
#include <stdio.h>
#include <stdint.h>
#include <stdlib.h>
#include <string.h>

#define DELTA 0x9e3779b9

void encrypt(uint32_t* v, uint32_t* k) {
    uint32_t v0 = v[0], v1 = v[1];
    uint32_t sum = 0;
    for (int i = 0; i < 32; i++) {
        sum += DELTA;
        v0 += ((v1 << 4) + k[0]) ^ (v1 + sum) ^ ((v1 >> 5) + k[1]);
        v1 += ((v0 << 4) + k[2]) ^ (v0 + sum) ^ ((v0 >> 5) + k[3]);
    }
    v[0] = v0;
    v[1] = v1;
}

uint8_t enc[56] = {
    0xAD, 0xDA, 0x01, 0xDC, 0xAE, 0x5B, 0x8A, 0x08, 
    0x4E, 0xF5, 0x4F, 0x8F, 0x6E, 0x5F, 0x9D, 0x9E, 
    0x0A, 0x4E, 0xA9, 0x08, 0x25, 0xAB, 0x45, 0xC2, 
    0x4B, 0xC9, 0x8F, 0x43, 0x3D, 0x51, 0xD6, 0x28, 
    0xF6, 0x72, 0xCD, 0xF4, 0x2B, 0xB4, 0x4A, 0x3B, 
    0xFB, 0x36, 0x66, 0xEF, 0xD6, 0x8A, 0x8C, 0xB2, 
    0xEB, 0x1A, 0x9C, 0x1B, 0x0A, 0x9C, 0x1F, 0x53
};

int main() {
    srand(1010000);

    uint32_t key[4];
    for (int i = 0; i < 4; i++) {
        key[i] = (uint32_t)rand();
    }

    char input[57];
    printf("Please input your flag: ");
    
    if (scanf("%56s", input) != 1) {
        fprintf(stderr, "Input error or EOF\n");
        return 1;
    }

    if (strlen(input) != 56) {
        printf("Length Error!\n");
        return 1;
    }

    uint8_t input_buf[56] = {0};
    memcpy(input_buf, input, 56);

    for (int i = 0; i < 56; i += 8) {
        uint32_t v[2];
        memcpy(&v, input_buf + i, 8);
        encrypt(v, key);
        memcpy(input_buf + i, &v, 8);
    }

    for (int i = 0; i < 56; i++)
    {
        if (enc[i]!=input_buf[i])
        {
            printf("Try Again!");
            return 1;
        }
        
    }
    
    printf("Congratulation!\n");
    return 0;
}
```

-------

这题是我想把远程动态调试和魔改upx混到一起的结果，主要是想让新生早点接触动态调试相关的操作，因为动态调试真的挺重要的。之前我自己并没有在比赛里面碰到过elf的upx壳，所以在这里出了一个。由于是第一次出题没什么经验，不知道这个题出的到底怎么样（~~不要拷打我.....~~)



## Week3

~~wmc看到这两个题目应该会有反应吧（（（~~

---------

### World's_end_BlackBox

用c++写的，程序反编译出来很难看

![image-20251103211612565](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest//post/202511032116701.png)

但实际上大部分都是语言底层的一些函数操作，和题目没什么关系，动态调试耐心一点看就可以了

第一个密钥段，函数名提示了是“KeyGenerate”，只要让程序运行到这里，密钥就会自动解出来，从内存抓取即可.直接分析密钥生成函数来解也可以，密钥生成的逻辑是xxtea

![image-20251103211637865](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest//post/202511032116990.png)

![image-20251103211700188](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest//post/202511032117315.png)

之后输入flag并校验，加密的逻辑就是一个小魔改rc4，多异或了一个7，虽然代码很难看，但耐心点分析还是能看出来的，然后动态调试到后面的比对部分就能提取出来密文，解密即可：

```go
flag=[0xFC,0xEA,0x15,0x2C,0x86,0x38,0x3F,0xF3,0x92,0xCE,0xDA,0x8E,0x48,0xD3,0x7,0x9F,0xD9,0x57,0xB1,0xEE,0x41,0x9A,0x4D,0xC5,0x65,0x6A,0xFF,0xC9,0x5D,0x34,0xAD,0xEA,0xB1,0x20,0x4B,0xDC,0xBD,0xD2,0x35,0x2,0x84,0x35,0x71,0xEC,0xE0,0x48,0x8E,0xEA,0x7B,0xAA,0xCF]
key="XaleidscopiX"
s=[]
t=[]
for i in range(256):
    s.append(i)
    t.append(ord(key[i % len(key)]))
j=0
for i in range(256):
   j=(j+s[i]+t[i])%256
   s[i],s[j]=s[j],s[i]
k=[]
i=j=0
for r in range(len(flag)):
    i=(i+1) % 256
    j=(j+s[i]) % 256
    s[i],s[j]=s[j],s[i]
    t=(s[i]+s[j]) % 256
    k.append(s[t])
for i in range(len(flag)):
    print(chr((flag[i]%256)^k[i]^7),end='')
```



### Calamity_Fortune

题目源码：

```cpp
#define _CRT_SECURE_NO_WARNINGS
#define DELTA 0x9e3779b9
#define MX (((z>>5^y<<2) + (y>>3^z<<4)) ^ ((sum^y) + (key[(p&3)^e] ^ z)))
#include <windows.h>
#include <stdio.h>
#include <time.h>
#include <stdint.h>
#include <string.h>
#include <stdlib.h>

void xorName(unsigned char v[],int len){

    for(int i = 0;i < len;i++){
        v[i]^=7;
    }
}

/* 小端字节 -> uint32_t */
static void str44_to_u32_le(const unsigned char input[44], uint32_t output[11]) {
    for (int i = 0; i < 11; ++i) {
        uint32_t v = 0;
        for (int j = 0; j < 4; ++j) {
            v |= ((uint32_t)input[i*4 + j]) << (8*j);
        }
        output[i] = v;
    }
}

/* uint32_t -> 小端字节 */
static void u32_to_str44_le(const uint32_t input[11], unsigned char output[44]) {
    for (int i = 0; i < 11; ++i) {
        uint32_t v = input[i];
        for (int j = 0; j < 4; ++j) {
            output[i*4 + j] = (unsigned char)((v >> (8*j)) & 0xFF);
        }
    }
}

static void YourGift(){
    char encFlag[] = {115, 25, 43, 0, 0, 12, 15, 13, 43, 8, 31, 62, 4, 26, 43, 24, 28, 7, 13, 10, 8, 54, 18, 21, 34, 6, 51, 17, 1, 12, 21, 10, 38, 62, 7, 4, 8, 25, 43, 13, 49, 24, 5, 15, 10, 20};
    char key[] = "Calamity";
    for (int i = 0; i < 46; i++)
    {
        printf("%c",encFlag[i] ^ key[i % 8]);
    }
}

static void shuffle_inplace(unsigned char s[]) {
    srand(101);
    int n = 60;
    for (int i = n - 1; i > 0; --i) {
        int j = (int)(rand() % (i + 1));
        char tmp = s[i];
        s[i] = s[j];
        s[j] = tmp;
    }
}

static void btea(uint32_t *v, int n, uint32_t const key[4])
{
    uint32_t y, z, sum;
    unsigned p, rounds, e;
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

static void base64_encode(unsigned char *input, size_t len, unsigned char *output) {
    const char b64_table_hex[64] = {
    0x41,0x42,0x43,0x44,0x45,0x46,0x47,0x48,0x49,0x4A,0x4B,0x4C,0x4D,0x4E,0x4F,0x50,
    0x51,0x52,0x53,0x54,0x55,0x56,0x57,0x58,0x59,0x5A,   // A-Z
    0x61,0x62,0x63,0x64,0x65,0x66,0x67,0x68,0x69,0x6A,0x6B,0x6C,0x6D,0x6E,0x6F,0x70,
    0x71,0x72,0x73,0x74,0x75,0x76,0x77,0x78,0x79,0x7A,   // a-z
    0x30,0x31,0x32,0x33,0x34,0x35,0x36,0x37,0x38,0x39,   // 0-9
    0x2B,0x2F                                            // + /
    };
    size_t i, j;
    unsigned char *p = output;
    for (i = 0; i < len; i += 3) {
        uint32_t val = 0;
        int remain = len - i;
        val |= input[i] << 16;
        if (remain > 1) val |= input[i+1] << 8;
        if (remain > 2) val |= input[i+2];
        for (j = 0; j < 4; j++) {
            if (j <= (remain)) {
                int idx = (val >> (18 - 6*j)) & 0x3F;
                *p++ = b64_table_hex[idx];
            } else {
                *p++ = '=';
            }
        }
    }
    *p = '\0';
}

static void xorFun(unsigned char arr[]){
    for (int i = 0; i < 60; i++)
    {
        arr[i]^=0x45;
    }
    
}

typedef int (WINAPI *MESSAGEBOXA_T)(HWND, LPCSTR, LPCSTR, UINT);

static MESSAGEBOXA_T g_origMessageBoxA = NULL;

static int HookInline_x64(void *targetFunc, void *newFunc, void **outTramp) {
    if (!targetFunc || !newFunc || !outTramp) return 0;

    const SIZE_T hookLen = 12; // mov rax, imm64; jmp rax
    BYTE *pTarget = (BYTE*)targetFunc;

    BYTE original[16];
    memcpy(original, pTarget, hookLen);

    SIZE_T trampSize = hookLen + 16;
    BYTE *tramp = (BYTE*)VirtualAlloc(NULL, trampSize, MEM_COMMIT | MEM_RESERVE, PAGE_EXECUTE_READWRITE);
    if (!tramp) return 0;

    /* 把被覆盖的原始字节复制到 trampoline */
    memcpy(tramp, original, hookLen);

    /* 在 trampoline 尾部追加跳回 target+hookLen 的指令：
       mov rax, imm64
       jmp rax
    */
    tramp[hookLen + 0] = 0x48; tramp[hookLen + 1] = 0xB8; /* mov rax, imm64 */
    *(UINT64*)(tramp + hookLen + 2) = (UINT64)(pTarget + hookLen);
    tramp[hookLen + 10] = 0xFF; tramp[hookLen + 11] = 0xE0; /* jmp rax */

    /* 修改目标内存保护，使其可写，并写入 hook 指令 */
    DWORD oldProt;
    if (!VirtualProtect(pTarget, hookLen, PAGE_EXECUTE_READWRITE, &oldProt)) {
        VirtualFree(tramp, 0, MEM_RELEASE);
        return 0;
    }

    /* 构建 hook：mov rax, newFunc; jmp rax */
    BYTE patch[12];
    patch[0] = 0x48; patch[1] = 0xB8; /* mov rax, imm64 */
    *(UINT64*)(patch + 2) = (UINT64)newFunc;
    patch[10] = 0xFF; patch[11] = 0xE0; /* jmp rax */

    memcpy(pTarget, patch, hookLen);

    /* 恢复内存保护并刷新指令缓存 */
    VirtualProtect(pTarget, hookLen, oldProt, &oldProt);
    FlushInstructionCache(GetCurrentProcess(), pTarget, hookLen);

    *outTramp = (void*)tramp;
    return 1;
}

static int WINAPI FlagMessageBoxA(HWND hWnd, LPCSTR lpText, LPCSTR lpCaption, UINT uType) {
    char trueFlag[] = {116,120,7,43,115,48,13,40,11,6,115,53,16,0,45,36,115,47,125,114,6,52,28,20,51,40,54,118,118,19,113,10,42,116,4,47,36,43,35,14,16,115,61,3,3,63,55,47,125,45,119,18,54,124,6,119,4,49,35,55};
    unsigned char input[45];
    unsigned char encodedInput[61];
    uint32_t v[11];
    unsigned char encInput[44];
    uint32_t const k[4]= {0x616c6143, 0x7974696d, 0x726f465f, 0x656e7574};

    unsigned char v1[85] = {0x4f,0x66,0x71,0x6e,0x69,0x60,0x27,0x6a,0x66,0x63,0x62,0x27,0x6e,0x73,0x27,0x73,0x6f,0x6e,0x74,0x27,0x61,0x66,0x75,0x2b,0x27,0x73,0x6f,0x62,0x27,0x74,0x72,0x65,0x74,0x62,0x76,0x72,0x62,0x69,0x73,0x27,0x62,0x69,0x64,0x75,0x7e,0x77,0x73,0x6e,0x68,0x69,0x27,0x74,0x6f,0x68,0x72,0x6b,0x63,0x27,0x65,0x62,0x27,0x66,0x27,0x77,0x6e,0x62,0x64,0x62,0x27,0x68,0x61,0x27,0x64,0x66,0x6c,0x62,0x27,0x61,0x68,0x75,0x27,0x7e,0x68,0x72,0x79};
    xorName(v1,85);
    printf("%s\n",v1);

    unsigned char v2[22] = {0x57,0x6b,0x62,0x66,0x74,0x62,0x27,0x4e,0x69,0x77,0x72,0x73,0x27,0x7e,0x68,0x72,0x75,0x27,0x61,0x6b,0x66,0x60};
    xorName(v2,22);
    printf("%s\n",v2);
    
    scanf("%44s", input);      
    input[44] = '\0';            
    int len = 0;
    while (input[len]!='\0')
    {
        len++;
    }
                                     
    if (len != 44) {
        unsigned char v3[13] = {0x4b,0x62,0x69,0x60,0x73,0x6f,0x27,0x42,0x75,0x75,0x68,0x75,0x26};
        xorName(v3,13);
        printf("%s\n",v3);
        exit(0);
    }

    str44_to_u32_le(input,v);

    btea(v,11,k);

    u32_to_str44_le(v,encInput);

    base64_encode((unsigned char*)encInput,44,encodedInput);

    shuffle_inplace(encodedInput);

    xorFun(encodedInput);

    for (int i = 0; i < 60; i++)
    {
        if (encodedInput[i]!=trueFlag[i])
        {
            unsigned char v4[26] = {0x44,0x66,0x6b,0x66,0x6a,0x6e,0x73,0x7e,0x26,0x27,0x77,0x6b,0x62,0x66,0x74,0x62,0x27,0x73,0x75,0x7e,0x27,0x66,0x60,0x66,0x6e,0x69};
            xorName(v4,26);
            printf("%s\n",v4);
            exit(0);
        }
        
    }
    
    unsigned char v5[18] = {0x41,0x68,0x75,0x73,0x72,0x69,0x62,0x26,0x40,0x68,0x68,0x63,0x27,0x4b,0x72,0x64,0x6c,0x26};
    xorName(v5,18);
    printf("%s\n",v5);

    return IDOK;
}

static int InstallInlineHook_MessageBoxA(void) {
    HMODULE hUser = GetModuleHandleA("user32.dll");
    if (!hUser) hUser = LoadLibraryA("user32.dll");
    if (!hUser) return 0;

    unsigned char v10[12] = {74,98,116,116,102,96,98,69,104,127,70,7};

    xorName(v10,12);

    void *pMsgA = (void*)GetProcAddress(hUser, (char*)v10);
    if (!pMsgA) return 0;

    void *tramp = NULL;
    if (!HookInline_x64(pMsgA, (void*)FlagMessageBoxA, &tramp)) return 0;

    g_origMessageBoxA = (MESSAGEBOXA_T)tramp;
    return 1;
}

static void __attribute__((constructor)) auto_install_hook(void) {
    InstallInlineHook_MessageBoxA();
}

int main(void) {
    SetConsoleOutputCP(CP_UTF8);
    SetConsoleCP(CP_UTF8);

    srand((unsigned)time(NULL));
    int secret = (rand() % 100) + 1;
    int guess = 0;

    printf("来猜个1-100之间的数字吧，猜对猜错都有flag哦\n");

    if (scanf("%d", &guess) != 1) return 1;

    if (guess == secret) {
        MessageBoxA(NULL, "You guessed right! Is it really right?", "Result", MB_OK);
    } else {
        printf("You guessed it wrong!\n");
        printf("虽然你猜错了，但仍然给你flag！\n");
        YourGift();
    }

    return 0;
}
```

编译的时候用了strip命令去掉了函数的符号名等调试信息，因此导致代码变得臃肿且难以分析，没什么别的办法只能慢慢看代码一边动态调试一边分析控制流，所涉及的新知识仅有这个IAT hook，其它的加密等均是前两周涉及过的，很考验耐心

直接反编译是一段很简单的代码，一个简单的猜数字，猜错了输出一个假的flag，猜对了会调用MessageBoxA函数，输出一段话

![image-20251103211728314](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest//post/202511032117439.png)

这里其实很明显是程序运行的时候动态地改变了MessageBoxA函数的地址，跳转到了一个自定义的函数逻辑，那里才是真正的加密，只要动态调试就能跟进。

这个点对新生来说可能很陌生，但这道题函数很少，因此在ida左侧的函数列表一个个点进去看也能找到那个自定义的加密函数（

预期是动态调试看到随机生成的那个数字，然后输入正确的数字进入自定义函数，或者直接修改汇编代码，进入if语句。

跳转到加密函数后，可以看到有很多的这种无意义字符串+异或7的操作

![image-20251103211758908](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest//post/202511032117044.png)

这里实际上是把输出语句先做了个加密，程序运行的时候动态改回去，本意就是引导师傅们动调这道题慢慢分析的（顺便也起到了隐藏函数的作用）

题目加密的顺序是xxtea->base64解码->乱序->异或0x45，师傅们可以根据源码对照着看，下面写一些我的分析

![image-20251103211813812](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest//post/202511032118910.png)

这里实际上是对输入的flag进行长度校验，若长度不足44则输出长度错误，然后程序退出。v55、v6都是地址值

![image-20251103211833338](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest//post/202511032118469.png)

这里是按照小端序把输入的字符串转化为每个元素为32bit数字的数组，便于接下来的xxtea计算

![image-20251103211852722](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest//post/202511032118843.png)

这里就是标准的xxtea，密钥、delta都已经给出了

![image-20251103211915196](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest//post/202511032119309.png)

这里是把前面xxtea加密生成的密文数组再转换回字符串格式，接下来是很标准的base64，不细说了

![image-20251103211938020](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest//post/202511032119135.png)

这段是用固定随机数序列乱序加密过程，接下来就是一段异或0x45（这一段异或主要是为了去除base64加密所会产生的可读字符串，防止shift+F12直接定位密文， 进而找到这个函数，还是为了隐藏）

然后进行比对，这里的v57是最前面赋值过的

![image-20251103211951368](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest//post/202511032119476.png)

后记：没想到这题的解这么少。。。。按理来说这么大且复杂的代码量不应该是新生赛出的东西，但现在基本上都在用ai工具。我测试过，如果直接把这一大串加密代码全部扔给GPT（完全直接把hook跳转的代码复制粘贴给它），它可以完全正确地分析出来流程

![image-20251103212018937](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest//post/202511032120058.png)

所以我认为即使是只做过前两周re的新生，也完全有能力做出来这题，因此这题出的应该不算过分（  毕竟现在打ctf基本都在用ai

做逆向的经常要面对一大串恶心的代码慢慢分析，往往会对着一大堆不知所云的反编译代码（有时甚至是汇编等）看上半天，我自己在逆向的时候也会经常用ai，但这并不是说让新生在做题的时候应该依赖ai

有的时候ai会显得很蠢，这时候需要你完全地去理解你要问什么、这个题到底是哪里难到你了，再加上你自己对这道题的一些分析和现有的信息才能让ai出一些你想要的结果。就像这题，如果只知道一味依赖ai，很有可能连后面的加密函数都找不到，卡死在main函数里面

我一直认为ai是学习工具，而不是一种自动化生产工具，不能把它的输出作为一种成品，而是作为补充信息的学习资料，有思考地解析它的输出结果，化为自己的一种经验，如果一味地依赖ai的输出，每次分析题目都是直接把代码丢给ai的话，迟早会吃亏的（有人以前就因为这个吃过大亏，我不说是谁。。。。。。）

逆向最需要的是耐心，而且它算是一个经验性学科，学的越久越明白(?)。学逆向需要的不是什么多高深的知识，而是大量重复且枯燥的练习所产生的一些经验，这些ai是没法帮你的。所以如果有新生师傅依靠ai做出了这道题，建议赛后有时间的话还是多分析一下

-------

回看一下我也感觉这两题出的其实不是很合适，很多地方其实是为了上难度而上难度。一开始我想的是既然都在用ai，那么代码稍微复杂一点似乎也不会影响新生学习，只要动态调试耐心慢慢看，借助ai也可以有能力做出来。但事实上很多刚接触CTF的新生貌似完全不知道如何下手了，如果没有起到引导的作用真的深感抱歉



## Week4

### 绯想天则

unity的小游戏，希望师傅们玩的开心:)

C#写的unity小游戏，且采用了mono编译（与之对应的是li2cpp编译），可以用dnspy分析

![image-20251103212200958](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest//post/202511032122098.png)

其中主要逻辑在Assembly-CSharp.dll里面，可以在EnemyStats-WinFlag里面找到flag解密逻辑

![image-20251103212225490](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest//post/202511032122620.png)

解密逻辑实际上就是一个标准的rsa，私钥和密文都已经给出了：

![image-20251103212249933](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest//post/202511032122070.png)

找ai梭一个脚本就能解

```python
from Crypto.PublicKey import RSA
from Crypto.Cipher import PKCS1_v1_5
import base64
import xml.etree.ElementTree as ET

EncryptText = (
    "TxDTykBFS+ewdHSIKSRRw63i4/7Os3pHqvC/WOnnFPKupfz0VpUqFRVEgtOdfJLdcxNKBvc67E/nIqU4dz8L88DZB9xVaKawdDgJ8c3EhI//r1aZkzbN2hURFdsS1UoF932XT9wPW61TsXPX7UyFAG4IInifxQr6KU7hyQNHIkpBkYsTgp/wxH5/g6IKEff8H/zEjbLcalck5k/r3vG8DeBQkhZUQ4I5HfIyetUBAmZyr8sZkygErKxVaF6vWZZtoPBkLzCxY0WIoaYcTfp+n5q1dUBDOshvXhVf1M3KGokZL2PqXT9K9Gv91d8aazXq7MV1iqCN4AwWAeFPn8OIYg=="
)

privateKeyXML = """<RSAKeyValue><Modulus>jR+j5ZyLvbOyQRZgJQtHl5slRSQ4igoTQrKrwnmIwOcrkc48RQ6qD6wFXYAbFmiu34YpO638surG2dFemO0+vSoJuFksK70amen3pdilSgUukdFZ3SEJ/7QoeWls40exLsVPn3zWclN5b1ESaL4TN0MpC9lJUuWqkwiYSU2fZYQg9Z7S05RcVtl0JgK9O/DmLjW6+t6RdUAyo+9gsPXdGNOd/f4LyOTbj0iaWg2aCGfZhz3UtqACS2q6L9p1a9L3vYgLNpp1GnUcZnA+CVfhzcCWTHQ4X7hTuJsyysFEm/6tei3uBKYq6/HnTrmo2rSZxKS/GuExRO3A9hmyD+PEcw==</Modulus><Exponent>AQAB</Exponent><P>+6YUEMyFZlINlnZYRznRU0qU2Krb4QaFCUnNhFsL37y55rnz0/hLfLSA2FistQiMLy0Yz01fkxOTtwwkWkHikRu7KFi7vQzTg/KbdKNnHJ11huemk0DuwxDghj+3uNC30heSA6NFlF47zlge8AY2J+iQ8JpgJNsrfZYNRZ5txD0=</P><Q>j5BSrK3Li9VaBvRn2UGMf8q2N0J7tbaRvQonHhU1uBQYlhifttmK5wr1PurZHsb7tiNIv0RluM9HaUbQ/CczqLskVKJNkwpVyGM2rydiqbZ/KaP00ytTiR7Hxd0GUC06Syfi2h1VwaEewAOTkRUo/DuKYugPSaiyqARipyhfRm8=</Q><DP>0lwCagiNevscYKqNIP0z/mxaAMTTCUhp7VnEct+pDV62CClpqcflUlmRW0jFFpAOn2ETXDdRraCv2lRMDycEPkjwKsoCJgaSyboEOXxetYzqsdrzZCTjciypg4/ABL506yrI5EGX6G7dj6AaPIr0umeuwXJK7IRJ1rGYZpoJKAE=</DP><DQ>HA4BCfughj/4KtnCHYOguCxd9WiJklYOHtoIEOnmKIXM1DAVrf7PFR1gFZ6BNXF/KPW2NqJgGoBvHRSYrF3gy31euSdKb4yafOFeg1X4AuBF81Y19rpFxcr9ER6DKFHeTWeK/kKzSnZ48t8ADF8NNlVQUsm0ixlraEgLG01ZaQM=</DQ><InverseQ>qZwSExM5GW+CsTtvN2DPmwQtLf7cTA2DwY+8+4bnR7X0MTqssUDNtc8l+HD3uml9BRg9m4t1PoY+qGsh5qEtFsITBvt0pqNM5mdg8WrB1e85Xzpdvsfqvv1PN3KsDjduzkY0SazVBlur+OX86JTF3jSLFeFkornO1ckHcApqU54=</InverseQ><D>LABbh/IhmAp5X9XsMGCt99VF76L1hgTSMI+pAkAGpa7uZM3a+OUznSNToO2ahIgrTkJ0hMkg62BMlAm15xTB5RVAZpxXK2QQ8UCEGM/N6aBn/ss5q7rrdTDlFcYLT2pBEoYu51lzO75PNKggh0wMjcSA/dLIC/LUFngtk12Cf5IRwsdn0Kc2aoiiHU0NtvWklLZGkzcs4VL5FI7n1yDeIS9I+lKA14dJUCEhAltfMMiTSq+vpzoSedOcc8V0v9O9mjef8W62DasLusKxCCQi6PzsLA7ul2yLuOWTi1oysnrUVZryOWTvMr2V3GC0wfGRdXajd6qwwKVvGUt72egeEQ==</D></RSAKeyValue>"""

def b64_to_int(s):
    return int.from_bytes(base64.b64decode(s), byteorder='big')

root = ET.fromstring(privateKeyXML)
fields = {child.tag: child.text.strip() for child in root}

n = b64_to_int(fields['Modulus'])
e = b64_to_int(fields['Exponent'])
d = b64_to_int(fields['D'])
p = b64_to_int(fields['P'])
q = b64_to_int(fields['Q'])

rsa_key = RSA.construct((n, e, d, p, q))

cipher = PKCS1_v1_5.new(rsa_key)
plaintext = cipher.decrypt(base64.b64decode(EncryptText), b'')

print(plaintext)
```

但更推荐另一种解法

只要把yns击败就能出flag，但是正常打基本上不太可能（攻击力=10，yns血量=5w且还有一堆逆天技能）

所以可以找到boss的血条，将其设置为很小的数字一击秒杀（

找到这里：

![image-20251104111503669](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest//post/202511041115864.png)

这里的返回值就是player和boss的血条，但由于boss的体质值更高，所以她的血条更厚一点，直接把返回值改为1，进去戳一下boss就似了（但需要注意boss戳一下player也似了）

--------

出到week4了突然发现好像没出小游戏啊（   然后想到有一个网友最近正在做一个Unity小游戏，于是给他上压力赶在week4放题前两天做出来了（

小游戏制作者：[海蓝石-v-的个人空间-海蓝石-v-个人主页-哔哩哔哩视频](https://space.bilibili.com/198624753?spm_id_from=333.337.0.0)

按难度来说我觉得这题甚至比不上week3我出的calamity_fortune，但这个C#逆向相对比较陌生，放在week4作为收尾小游戏也不错



## 后记

我与CTF的缘分始于2024的0xGame，那个时候刚上大学正处于不知道学什么，以后要干嘛的心理，然后看到了0xGame，我记得我仅仅做了第一周的6个题，其中只有一道逆向，但是我还是觉得这个东西蛮有意思

后面自己天天跑去图书馆，先是补C、C++、python等各个语言以及编程的基础（~~没人带啊纯摸黑~~），到了12月开始复现0xgame，之后又是单打独斗一个人学自己的，后面进了校队认识了很多大佬，再到现在放弃CTF，终结在2025的0xGame，好像也不错。具体的回忆细节就留到2025年终总结吧，这一年到现在为止也发生了很多事情

总之希望0xGame能一直办下去，也希望这一届的0xGame能给刚入学的新生找到适合自己的方向

**暗闇を　照らすような　満月じゃなくても**
