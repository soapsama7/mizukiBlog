---
title: VNCTF2025 reverse复现
published: 2025-07-15 12:31:22
description: VNCTF2025 复现Writeup
pinned: false
tags: [reverse,CTF]
category: ctfWriteup
---

## Fuko's\_starfish

题目给出一个exe和dll文件，先看看exe

![](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest/img/1752390879-image.png)

先加载这个dll文件，若加载成功则提示我们需要完成三个小游戏，然后进入函数sub\_140001490，那么跟进它看看

![](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest/img/1752390987-image.png)

第一个小游戏就在sub\_140001270内，是一个猜数字小游戏

![](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest/img/1752391088-image.png)

原本想动调的，但这道题似乎搞了挺多反调试，找不到怎么解决，强行运行吧，前面的猜数字和贪吃蛇玩一下就过了，到最后这里

![](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest/img/1752392408-image-1024x525.png)

对应dll文件里面是

![](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest/img/1752392484-image.png)

这里让我们输入密钥，下面的sub\_180001650是个AES加密，跟进看可以发现

![](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest/img/1752393579-image.png)

这里有一大串赋值语句，应该就是密钥，跟进这些byte\_xxxx就可以发现这个函数：

![](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest/img/1752392997-image.png)

它就是生成密钥的函数，而这个函数还有花指令，简单去花，就是这一段，它用rax寄存器混淆ida，使ida错误判断程序执行流，全nop即可：

![](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest/img/1752393053-image.png)

这里在中间设置了随机种子，改变了前面16个赋值过的byte，把它作为密钥赋值，再回去看那个AES函数，它有调试检测，若检测到调试则执行流会进if块，那么正确解密肯定要看else块

![](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest/img/1752393685-image.png)

这里把他们都异或了一个0x17，那么根据上述信息就可以得到密钥了

```
#include <stdio.h>
#include <stdlib.h>
int main(){
    srand(114514);
    for (int i = 0; i < 16; i++)
    {
        int v10 = rand();
        printf("%02x",((unsigned char)(v10 + (v10 / 255))) ^ 0x17);
    }
    
    return 0;
}
// 09e5fdeb683175b6b13b840891eb78d2
```

再根据后面的比对处拿到密文，AES解密即可

![](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest/img/1752394705-image-1024x336.png)

## hook\_fish

apk文件，拖进jadx看到oncreate函数

![](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest/img/1752396516-image-1024x311.png)

这里无论怎样也钓不到鱼，但特别强调要联网，需要注意一下。同时注意看encrypt和fish这两个方法

encrypt这个方法里边是对我们输入的东西进行一些加密，但没有看到比对函数和密文

![](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest/img/1752396873-image.png)

fish方法则是从一个URL地址下载一个dex文件，这个地址可以在程序里面找到：

![](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest/img/1752396833-image-1024x544.png)

后面的这些方法也都是根据这个dex文件来工作的

![](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest/img/1752397279-image-1024x401.png)

所以应该要分析一下这个dex文件，里面有一些其他的信息，不过这个下载地址已经失效了，等搞到这个dex再复现吧（

## kotlindroid

不是常规的apk逆向，用kotlin和Jetpack Compose框架写的，java层反编译的代码和正常的不太一样

从xml看到的mainactivity里面其实是应用的第一层，即

![](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest/img/1752459958-image-1024x576.png)

但从mainactivity里面慢慢找太费时间，而且也不好找，里面有很多关于compose框架的无用代码

但运行一下，可以直接在jadx里面搜字符串快速定位关键逻辑

![](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest/img/1752459877-image-1024x401.png)

分析这里，可以得知是AES/GCM/NoPadding加密方式，这里可以直接看到iv和密文，但还不知道key，往前看，交叉引用check函数，定位到这里

![](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest/img/1752461214-image.png)

那么key就得知了

```
key1=[118, 99, 101, 126, 124, 114, 110, 100]
key2=[123, 113, 109, 99, 97, 122, 124, 105]
for i in key1:
    print(chr(i^23),end='')
for i in key2:
    print(chr(i^8),end='')
# atrikeyssyekirta
```

信息还没完全获取，继续跟进sec函数里面的参数：SearchActivityKt$sec$1，找到这里

![](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest/img/1752461648-image-1024x471.png)

这里可以看到base64编码，符合密文的格式，然后再看到这一行：  
string encode$default = Base64.encode$default(Base64.INSTANCE, ArraysKt.plus(generateIV, doFinal), 0, 0, 6, **null**);  
这里的意思是，把一个经过base64编码的字符串和这个iv字符串拼接，且iv字符串在前面

把密文拉去base64解密，可以看到前面6个字符是114514，就是iv字符串，因此解密的时候要把前6个字符删掉才是真正的密文

到这里如果要解密，还差两个参数：tag和add data

但突然发现如果用encrypt的话，不需要这两个参数也能解出来（

![](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest/img/1752462848-image-1024x569.png)

去了解了一下AES/GCM加密方式：

![](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest/img/1752546979-image-1024x405.png)

也就是说，GCM分为两个模块：加密和校验

在解密的时候，我们必须要提供这完全的四个参数：key、iv、AAD、GCM Tag，否则这些解密工具会拒绝输出密文，以此确保被加密的数据没有被篡改，即“要么全对，要么全错“，而AAD和GCM Tag就是进行校验的参数，其中GCM Tag是根据AAD、key、iv、密文这四个参数计算得来的

但是，我现在解密密文，不需要关心数据是不是对的（他肯定是对的），所以我只要解密就好了，不需要关心AAD和Tag这两个参数。而GCM方式解密的底层逻辑是CTR模式，这个模式的工作原理简单概述：  

![](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest/img/1752547493-image.png)

这里的随机数（Nonce）就是iv向量，而计数器是

![](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest/img/1752547545-image.png)

先要知道，AES的不同模式都不会改变AES本身的加密数学运算，正常的ECB模式是把原文简单分割成128位的小块，然后分组加密。而CTR模式则是加密Nonce + Counter（如上图，这里的示例不太规范，AES只会接收128位的原文），然后输出128位的密文，这128位的密文，再直接与原文进行异或（原文也按128位拆分）

所以，CTR模式最终对原文进行的操作仅仅是一个简单的异或，那么，如果我能够提供密钥key和iv向量，GCM模式底层的CTR加密运算就可以生成正确的密钥流，然后进行异或。同时异或是可逆运算，我把密文再进行异或一次相同的值，就可以恢复到原文

可是直接用CTR模式解密就不行，会提示iv向量长度不够，原因是：

![](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest/img/1752548268-image.png)

## 幸运转盘

鸿蒙逆向，去华为官网下个DevEco Studio，然后运行一下模拟器可以运行这个程序

![](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest/img/1752633858-image-1024x491.png)

随便输一个字符串就能进入第二页面

![](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest/img/1752633907-image.png)

但这里转盘会失败，并输出一段字符串

解压hap文件得到abc文件，把abc文件拖入jadx-dev-all.jar可以分析，但很难看，搜索上面转盘提示的错误字符串也没东西

![](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest/img/1752632834-image-1024x544.png)

没什么好的办法，只能硬看，在MyPage这里找到一个数组，比较可疑，就追着这个数组看看

然后找到这两坨

![](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest/img/1752634414-image.png)

![](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest/img/1752634423-image.png)

这个arg0就是我们在上面页面输入的flag，怎么来的？看看index

![](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest/img/1752634561-image-1024x544.png)

这里的index和mypage实际上就对应了两个页面，index是接收输入的页面，mypage就是转盘页面

先把上面的数组密文逆向操作一下看看：

```
a=[101, 74, 76, 49, 101, 76, 117, 87, 55, 69, 118, 68, 118, 69, 55, 67, 61, 83, 62, 111, 81, 77, 115, 101, 53, 73, 83, 66, 68, 114, 109, 108, 75, 66, 97, 117, 93, 127, 115, 124, 109, 82, 93, 115]
for i in a:
    print(chr((i^7)-1),end='')
# aLJ5aJqO/ApBpA/C9S8gUIsa1MSDBtijKDeqYwsziTYs
```

然后反编译这个libhello.so并找到MyCry函数，定位到这里

![](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest/img/1752637554-image-1024x457.png)

先看前面

![](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest/img/1752638284-image.png)

这里对传入的明文逐字节+3

![](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest/img/1752638349-image-1024x429.png)

这里的v5是根据x、y计算的，x和y看到java层的调用处

![](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest/img/1752638398-image.png)

一个是输入的长度，一个是24，这个v5的复杂函数其实就是计算平方和开根

![](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest/img/1752638484-image.png)

根据前面得到的密文，长度为44，所以v5不应该等于40，也就是说应该走下面的sub\_i111iIlii逻辑，这个逻辑是标准的rc4，在最后异或的地方多异或了一个0x18

但这样的话flag求不对，那就只能猜测或许截断了部分密文，使得v5=40，强制走了上面的sub\_i111iIl1i函数，这样flag就对了，先把密文base64解码，然后rc4

```
flag=[0x68,0xb2,0x79,0x68,0x9a,0x8e,0xfc,0x0a,0x41,0xa4,0x0f,0xc2,0xf5,0x2f,0x20,0x50,0x8b,0x1a,0xd4,0xc4,0x83,0x06,0xd8,0xa3,0x28,0x37,0xaa,0x63,0x0b,0x33,0x89,0x36,0x2c]
key="Take_it_easy"
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
    print(chr(((flag[i]^40)^k[i]) - 3),end='')
```

鸿蒙逆向就是比较恶心，java层乱码很多，要慢慢细看

## AndroidLux

apk文件，arm64架构模拟器打不开，先jadx分析，找到主逻辑

![](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest/img/1753241595-image-1024x469.png)

这里接收flag，然后通过connectAndSendLocalSocketServer连接一个不知道什么东西，跟进一下connectAndSendLocalSocketServer看到

![](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest/img/1753241656-image-1024x577.png)

![](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest/img/1753241710-image.png)

这里有神秘数字（

应该是把我们输入的flag发给一个服务器，然后在那个地方进行校验。这个apk不联网，那服务器肯定在本地，解压apk乱翻一下，最后在asset里面发现env文件，这是个压缩包，解压发现

![](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest/img/1753241789-image.png)

这好像就是一个小linux系统，去root文件夹里面可以找到env这个elf文件，反编译一下

有点花指令，查一下资料了解一下arm64汇编，可以识别出来这里是花指令：  

![](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest/img/1753242368-image-1024x466.png)

一共有两处，全nop掉就可以分析

![](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest/img/1753242458-image-1024x457.png)

是个魔改base64，但解出来的flag不对

找了点题解看看，这题好像还挺复杂的... 题解里面提到的什么proot、rootfs需要了解一下

简单来说这个题的apk文件用了一个叫”proot“的开源项目，它可以在apk里面模拟出来一个linux系统，这区别于虚拟机，相当于一个小环境。java层的代码通过socket和这个小环境通信，把flag发过去给它校验。而rootfs其实就是这个小linux系统，也就是上面解压出来得到的那个env文件夹

但这个rootfs是出题人自己搞的，也就是说他可以在里面动些手脚。举个例子：在正常的操作系统里面用命令ls可以列出文件夹的内容，但在roofs文件夹里面可以对这个命令做一些修改，修改之后的ls指令可能就不是原来的功能（比如触发点后门什么的）

官方题解提到：”rootfs一般是脚本构建的，这样才能保持软件包不会过于落后，既然如此，出题者只可  
能在原本rootfs基础上修改rootfs。“

也就是说，出题人只能对rootfs里面的文件做些手脚，不能搞一些大的操作

那么就看看哪些文件是最近被更改过的，这里面应该就有信息

而官方题解又提到：”看到ld.so.preload都该有所警觉了吧，这个文件打开的内容是/usr/libexec/libexec.so“

这个ld.so.preload是个特殊的文本文件，在linux程序链接的时候起作用，相当于告诉linux：在运行这个程序动态链接的时候，先链接这个文本文件里面指出的那些动态链接库。因此这个东西有很强的hook劫持作用。这个文件打开了libexec.so文件，那么这个文件里面肯定有一些东西，反编译它看看

果然，它hook了read和strncmp两个函数

![](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest/img/1753245208-image.png)

![](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest/img/1753245216-image-1024x457.png)

一个是异或1，一个是根据不同的字符进行加减13的操作然后再比较，回到原来的主逻辑可以发现

![](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest/img/1753245280-image.png)

read出现在base64之前，strncmp在base64之后

那么加密逻辑就是异或1->魔改base64->根据字符加减13

```
import sys

BASE64_REV = [-1] * 256
alphabet = "TUVWXYZabcdefghijABCDEF456789GHIJKLMNOPQRSklmnopqrstuvwxyz0123+/"
for i in range(64):
    BASE64_REV[ord(alphabet[i])] = i


def decode_custom_base64(encoded_str: str) -> bytes:
    if not encoded_str:
        return None

    encoded_len = len(encoded_str)
    if encoded_len % 4 != 0:
        sys.stderr.write("length error\n")
        return None

    pad = 0
    if encoded_len >= 1 and encoded_str[encoded_len - 1] == '=':
        pad += 1
    if encoded_len >= 2 and encoded_str[encoded_len - 2] == '=':
        pad += 1

    decoded_len = (encoded_len // 4) * 3 - pad
    decoded_bytes = bytearray(decoded_len)

    decoded_index = 0
    for i in range(0, encoded_len, 4):
        ch1 = encoded_str[i]
        ch2 = encoded_str[i + 1]
        ch3 = encoded_str[i + 2]
        ch4 = encoded_str[i + 3]

        d1 = BASE64_REV[ord(ch1)] if ch1 != '=' else 0
        d2 = BASE64_REV[ord(ch2)] if ch2 != '=' else 0
        d3 = BASE64_REV[ord(ch3)] if ch3 != '=' else 0
        d4 = BASE64_REV[ord(ch4)] if ch4 != '=' else 0

        if ((ch1 != '=' and d1 < 0) or \
                (ch2 != '=' and d2 < 0) or \
                (ch3 != '=' and d3 < 0) or \
                (ch4 != '=' and d4 < 0)):
            sys.stderr.write("NO!\n")
            return None

        if ch3 == '=':
            a = (d1 << 2)  d2
            decoded_bytes[decoded_index] = a
            decoded_index += 1
        elif ch4 == '=':
            a = (d1 << 2)  (d2 & 3)
            b = ((d2 >> 2) << 4)  d3

            decoded_bytes[decoded_index] = a
            decoded_index += 1
            if decoded_index < decoded_len:
                decoded_bytes[decoded_index] = b
                decoded_index += 1
        else:
            a = (d1 << 2)  (d2 & 3)
            b = ((d2 >> 2) << 4)  (d3 & 0xF)
            c = ((d3 >> 4) << 6)  d4

            decoded_bytes[decoded_index] = a
            decoded_index += 1
            if decoded_index < decoded_len:
                decoded_bytes[decoded_index] = b
                decoded_index += 1
            if decoded_index < decoded_len:
                decoded_bytes[decoded_index] = c
                decoded_index += 1

    return bytes(decoded_bytes[:decoded_index])


if __name__ == "__main__":
    EncryptedFlag = 'RPVIRN40R9PU67ue6RUH88Rgs65Bp8td8VQm4SPAT8Kj97QgVG=='
    enc1 = ''
    for i in range(len(EncryptedFlag)):
        k = ord(EncryptedFlag[i])
        for j in range(48, 123):
            if 64 < j <= 77 and j + 13 == k:
                enc1 += chr(j)
                break
            elif 77 < j <= 90 and j - 13 == k:
                enc1 += chr(j)
                break
            elif 96 < j <= 109 and j + 13 == k:
                enc1 += chr(j)
                break
            elif 109 < j <= 122 and j - 13 == k:
                enc1 += chr(j)
                break
            elif 48 <= j <= 57 and j == k:
                enc1 += chr(j)
                break
            elif EncryptedFlag[i] == '=':
                enc1 += chr(k)
                break

    enc2_bytes = decode_custom_base64(enc1)

    if enc2_bytes is not None:
        enc2_hex = enc2_bytes.hex()
        for i in range(0, len(enc2_hex), 2):
            k = int(enc2_hex[i:i + 2], 16)
            print(chr(k ^ 1), end='')
        print()
    else:
        print("解码失败。")
```