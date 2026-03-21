---
title: H&NCTF2025 reverse wp
published: 2025-06-13 18:29:28
description: HNCTF writeup
pinned: false
tags: [CTF,reverse]
category: ctfWriteup
---


## 签到Re

动调发现是把我们的输入分为四个一组做了小加密（sub\_13AC内）

直接z3

```
from z3 import *
key = 0xFB341651

M00 = (key & 0xFF)         # 0x51
M01 = ((key >> 8) & 0xFF)  # 0x16
M10 = ((key >> 16) & 0xFF) # 0x34
M11 = ((key >> 24) & 0xFF) # 0xfb

encrypted_data = [
    0x0, 0x0, 0x0, 0x25, 0xC, 0xE2, 0x70, 0x89, 0x98, 0xB2, 0xBB, 0xE4, 0x94, 0xA0, 0x95, 0xAC, 0x38, 0x92, 0x22, 0xF8,
    0xE, 0x7B, 0x76, 0x1A, 0x66, 0xC8, 0x3, 0x5, 0x2E, 0x7D, 0xA1, 0x4, 0x3D, 0xC0, 0x62, 0xFE, 0x66, 0x67, 0x2, 0x87,
    0x81, 0xF4, 0x0, 0x0
]
original_data_len = 0x2C
flag = [BitVec(f'flag[{i}]', 8) for i in range(0x2C)]

s = Solver()
for i in range(0, len(encrypted_data), 4):
    x_block_0 = flag[i]
    y_block_0 = flag[i+1]
    x_block_1 = flag[i+2]
    y_block_1 = flag[i+3]

    encrypted_x_block_0_prime = (x_block_0 * M00 + y_block_0 * M01)
    encrypted_y_block_0_prime = (x_block_0 * M10 + y_block_0 * M11)

    encrypted_x_block_1_prime = (x_block_1 * M00 + y_block_1 * M01)
    encrypted_y_block_1_prime = (x_block_1 * M10 + y_block_1 * M11)

    s.add(Extract(7, 0, encrypted_x_block_0_prime) == encrypted_data[i])
    s.add(Extract(7, 0, encrypted_y_block_0_prime) == encrypted_data[i+1])
    s.add(Extract(7, 0, encrypted_x_block_1_prime) == encrypted_data[i+2])
    s.add(Extract(7, 0, encrypted_y_block_1_prime) == encrypted_data[i+3])

if s.check() == sat:
    m = s.model()
    decrypted_bytes = [m[flag[j]].as_long() for j in range(len(flag))]
    for i in decrypted_bytes:
        print(chr(i),end='')
else:
    print("No")

# H&NCTF{840584fb08a26f01c471054628e451}
```

## Just game

输入一些数字构造出来符合题目要求的字符串 "acoderjourney"

拷打ai找到我们输入的数字和程序做的事的对应规则（

![](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest/img/1749810626-image-1024x571.png)

动调发现输入1 + ASCII 可以直接追加一个字符，但是只能用一次

不太会写代码，一边手算一边拷打ai出结果了（ 然后本地测试过再远程连一下就出flag了

![](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest/img/1749810638-image-1024x525.png)

## **HNDRIVER**

主程序接收参数然后传给kernel，也就是主逻辑在另一个sys文件里，那就看它

这里加载sys有点麻烦，就静态分析吧，反正能拷打ai

看校验，跟踪sub\_140001000函数，找到主逻辑部分

![](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest/img/1749810673-image.png)

看来started应该就是程序会执行的东西，大于0表示执行成功，那么就看started里面的函数都在做什么

一开始我没发现，因为ConnectNotifyCallback函数里面东西挺多，有一些很长的函数，我以为是什么块加密（结果是copy函数），怼着它看了半天，还以为有什么文件操作，后面无功而返，就回去看了下Registration\_，发现它好像是个结构体

![](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest/img/1749810698-image.png)

这里面也有几个函数，最后摸半天，因为这个函数非常可疑

![](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest/img/1749810705-image.png)

所以摸到了这里，然后看一下sub\_1400010C0这不就base64吗

![](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest/img/1749810725-image-1024x459.png)

其它参数我看不懂，但是这个v29就是前面那个函数操作过的，我照着那个函数写一下，把v29打印出来

```
a = [0] * 0x40
unk_1400042D0 = [0x7A,0x14,0xDE,0xD3,0xB0,0xC9,0xD,0x17,0x1C,0x45,0xD0,0x86,0x94,0xDD,0x13,0x39,0x14,0x61,0xD7,0xC8,0xB9,0x9F,0x37,0x2A,0x10,0x4F,0xFD,0x94,0x81,0x96,0x6C,0x3E,0x3,0x56,0x8C,0xFF,0xB7,0xEC,0x21,0x39,0x2E,0x70,0xD6,0xF1,0xB3,0xF1,0x27,0x2B,0x4E,0x55,0xD1,0x91,0xBE,0xC6,0x23,0x32,0x8,0x62,0xC3,0xBF,0x8D,0xCF,0x12,0x6D,0x11]
byte_1400042C0 = [0x51,0x23,0x97,0xE8,0xDC,0xBA,0x45,0x67]
for i in range(0x40):
    a[i] = i ^ unk_1400042D0[i] ^ byte_1400042C0[i % 8]
key = 20250603
for i in range(63,-1,-1):
    key = (1103515245 * key + 114514) & 0x7FFFFFFF
    tmp = key % (i+1)
    a[tmp],a[i] = a[i],a[tmp]
for i in a:
    print(chr(i),end='')

# idhR+nWSPOU0CGIrNmAqVZlYuo2sDt7yg6MBXF1aw4Kv9LHJkjb5p8/zxcefQ3ET
```

  

好像就是标准base64的表被换了之后的样子，想到原来的main函数里面有一大串base64编码，拉去解码一下成了  

![](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest/img/1749810762-image-1024x567.png)

## xxxR01d（复现）

比较折磨人的题，还是对安卓逆向不太熟悉

java层有混淆，jadx分析会出问题，用jeb可以正常分析

这里调用native方法Tungtungtungsahur对传入的flag进行加密然后经过validateEncryptedData函数校验

![](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest/img/1749819125-image-1024x416.png)

这里注意密钥会被改变，经过这里

![](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest/img/1749819289-image.png)

![](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest/img/1749819312-image-1024x416.png)

方法比较复杂但没有要解密的部分，可以抄下来运行，但是fridahook应该是更简单的方法，但这道题有混淆，这就是这道题的难点，看native层，可以在

![](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest/img/1749819378-image.png)

\_init\_array段是一个初始化段，在动态链接库被应用程序加载完毕后，它就已经执行完了，而应用程序一运行就会加载这个动态链接库

看到函数

![](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest/img/1749819387-image.png)

这里的pthread\_create就是创建一个线程，然后执行函数start\_routine，执行完线程就没啥用了

这个函数里面有这样一段

![](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest/img/1749819420-image.png)

也就是说我们正常的frida代码一注入，程序就会立刻退出。所以要绕过它再进行我们接下来的操作。先不管这个，分析一下加密函数的逻辑先。值得一提的是这道题在程序里面内置了解密函数

![](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest/img/1749820088-image-1024x171.png)

先看加密函数吧

![](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest/img/1749820157-image-1024x457.png)

猜测sub\_16830动态创建了密钥v23，然后在sub\_16C50里面实现加密逻辑

官网wp提到这是twofish加密，我确实没见过。。。也不知道怎么分析，如果这题不内置解密函数可能难度就上来了

可是密钥生成部分却用到了随机数，应该要动态调试才能获得

![](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest/img/1749820398-image.png)

比赛的时候我就一直卡在找动调的方法了，因为init段的反调试，动调始终没成功，frida我也不是很熟悉，也没成功绕过

这里学习一下这位师傅的frida代码：[H&NCTF 2025 WriteUp 棱晶の小窝](https://astralprisma.github.io/2025/06/08/hn_25/)

```
function hexToBytes(hex) {
    for (var bytes = [], c = 0; c < hex.length; c += 2)
        bytes.push(parseInt(hex.substr(c, 2), 16));
    return bytes;
}

function bytesToHex(bytes) {
    return Array.prototype.map.call(new Uint8Array(bytes), function (b) {
        return ('0' + b.toString(16)).slice(-2);
    }).join('').toUpperCase();
}

var cipherHex = "3205ACCD2A7471916010989C15288D8E18EC2A88F1351C46D9E38DFFF293426F";
// validateEncryptedData函数内硬编码的密文

var cipherBytes = hexToBytes(cipherHex);

var libName = "libZ1Y4.so";

Module.findExportByName(libName, "sub_13030") && Interceptor.attach(Module.findExportByName(libName, "sub_13030"), {
    onLeave: function(retval) {
        retval.replace(0);
    }
});

Module.findExportByName(libName, "start_routine") && Interceptor.replace(Module.findExportByName(libName, "start_routine"), new NativeCallback(function(arg0) {
    return;
}, 'void', ['pointer']));

var fgetsPtr = Module.findExportByName("libc.so", "fgets");
if (fgetsPtr) {
    Interceptor.attach(fgetsPtr, {
        onEnter: function(args) {
            this.buf = args[0];
            this.size = args[1];
            this.stream = args[2];
        },
        onLeave: function(retval) {
            if (retval.toInt32() !== 0) {
                var bufStr = Memory.readUtf8String(this.buf);
                if (bufStr && (
                    bufStr.includes("frida") 
                    bufStr.includes("gadget") 
                    bufStr.includes("agent") 
                    bufStr.includes("/data/local/tmp/") 
                    bufStr.includes("-64.so") 
                    bufStr.includes("-32.so")
                )) {
                    Memory.writeUtf8String(this.buf, "sth");
                }
            }
        }
    });
}

var connectPtr = Module.findExportByName("libc.so", "connect");
if (connectPtr) {
    Interceptor.attach(connectPtr, {
        onEnter: function(args) {
            var addr = args[1];
            var port = Memory.readU16(addr.add(2));
            if (port === 0x69A6  port === 0x6A6A) {
                this.block = true;
            }
        },
        onLeave: function(retval) {
            if (this.block) {
                retval.replace(-1);
            }
        }
    });
}

Java.perform(function () {
    var EditText = Java.use("android.widget.EditText");
    var SpannableStringBuilder = Java.use("android.text.SpannableStringBuilder");
    EditText.getText.overload().implementation = function () {
        var fakeInput = Java.use("java.lang.String").$new("sth");
        return SpannableStringBuilder.$new.overload('java.lang.CharSequence').call(SpannableStringBuilder, fakeInput);
    };
    EditText.toString.overload().implementation = function () {
        return Java.use("java.lang.String").$new("sth");
    };
});

Java.perform(function () {
    var MainActivity = Java.use("com.aaron.xxxr01d.MainActivity");
    var Toast = Java.use("android.widget.Toast");
    MainActivity.C73ck19unt.implementation = function () {
        console.log("[+] Hooked C73ck19unt(), using fixed ciphertext as input");
        var arr_b = cipherBytes;
        var nativeInterface = this.nativeInterface.value;
        var decryptedArr = nativeInterface.Tralalerotralala.overload('[B', '[B', '[B').call(nativeInterface, 
            MainActivity.FIXED_KEY.value, 
            MainActivity.FIXED_IV.value, 
            arr_b
        );
        if (decryptedArr == null) {
            Toast.makeText(this, "解密失败", Toast.LENGTH_SHORT).show();
            return;
        }
        var decryptedFlag = Java.use("java.lang.String").$new(decryptedArr);
        console.log("[+] 解密后的 flag 是:", decryptedFlag);
        console.log("[DEBUG] 解密结果 (hex):", bytesToHex(decryptedArr));
        Toast.makeText(this, "flag: " + decryptedFlag, Toast.LENGTH_LONG).show();
        if (this.nativeInterface.value.validateEncryptedData(arr_b, decryptedArr)) {
            Toast.makeText(this, "校验成功！", Toast.LENGTH_SHORT).show();
        } else {
            Toast.makeText(this, "校验失败！", Toast.LENGTH_SHORT).show();
        }
    };
});
```

经过测试，代码可以改成

```
function hexToBytes(hex) {
    for (var bytes = [], c = 0; c < hex.length; c += 2)
        bytes.push(parseInt(hex.substr(c, 2), 16));
    return bytes;
}

function bytesToHex(bytes) {
    return Array.prototype.map.call(new Uint8Array(bytes), function (b) {
        return ('0' + b.toString(16)).slice(-2);
    }).join('').toUpperCase();
}

var cipherHex = "3205ACCD2A7471916010989C15288D8E18EC2A88F1351C46D9E38DFFF293426F";
var cipherBytes = hexToBytes(cipherHex);

var libName = "libZ1Y4.so";

var fgetsPtr = Module.findExportByName("libc.so", "fgets");
if (fgetsPtr) {
    Interceptor.attach(fgetsPtr, {
        onEnter: function(args) {
            this.buf = args[0];
            this.size = args[1];
            this.stream = args[2];
        },
        onLeave: function(retval) {
            if (retval.toInt32() !== 0) {
                var bufStr = Memory.readUtf8String(this.buf);
                if (bufStr && (
                    bufStr.includes("frida") 
                    bufStr.includes("gadget") 
                    bufStr.includes("agent") 
                    bufStr.includes("/data/local/tmp/") 
                    bufStr.includes("-64.so") 
                    bufStr.includes("-32.so")
                )) {
                    Memory.writeUtf8String(this.buf, "sth");
                }
            }
        }
    });
}

Java.perform(function () {
    var EditText = Java.use("android.widget.EditText");
    var SpannableStringBuilder = Java.use("android.text.SpannableStringBuilder");
    EditText.getText.overload().implementation = function () {
        var fakeInput = Java.use("java.lang.String").$new("sth");
        return SpannableStringBuilder.$new.overload('java.lang.CharSequence').call(SpannableStringBuilder, fakeInput);
    };
    EditText.toString.overload().implementation = function () {
        return Java.use("java.lang.String").$new("sth");
    };
});

Java.perform(function () {
    var MainActivity = Java.use("com.aaron.xxxr01d.MainActivity");
    var Toast = Java.use("android.widget.Toast");
    MainActivity.C73ck19unt.implementation = function () {
        console.log("[+] Hooked C73ck19unt(), using fixed ciphertext as input");
        var arr_b = cipherBytes;
        var nativeInterface = this.nativeInterface.value;
        var decryptedArr = nativeInterface.Tralalerotralala.overload('[B', '[B', '[B').call(nativeInterface, 
            MainActivity.FIXED_KEY.value, 
            MainActivity.FIXED_IV.value, 
            arr_b
        );
        if (decryptedArr == null) {
            Toast.makeText(this, "解密失败", Toast.LENGTH_SHORT).show();
            return;
        }
        var decryptedFlag = Java.use("java.lang.String").$new(decryptedArr);
        console.log("[+] 解密后的 flag 是:", decryptedFlag);
        console.log("[DEBUG] 解密结果 (hex):", bytesToHex(decryptedArr));
    };
});
```

使用frida -U -f com.aaron.xxxr01d -l E:\\edge\\study1.js注入

![](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest/img/1749821839-image-1024x290.png)

我删掉的代码是无效的，因为它们注入的太晚了，没有得到执行。或是没有起到绕过的作用。那为什么这段代码却有用并且成功绕过反调试了？

```
var fgetsPtr = Module.findExportByName("libc.so", "fgets");
if (fgetsPtr) {
    Interceptor.attach(fgetsPtr, {
        onEnter: function(args) {
            this.buf = args[0];
            this.size = args[1];
            this.stream = args[2];
        },
        onLeave: function(retval) {
            if (retval.toInt32() !== 0) {
                var bufStr = Memory.readUtf8String(this.buf);
                if (bufStr && (
                    bufStr.includes("frida") 
                    bufStr.includes("gadget") 
                    bufStr.includes("agent") 
                    bufStr.includes("/data/local/tmp/") 
                    bufStr.includes("-64.so") 
                    bufStr.includes("-32.so")
                )) {
                    Memory.writeUtf8String(this.buf, "sth");
                }
            }
        }
    });
}
```

我添加 console.log('2222222222222222222222222222222222'); 输出，发现当我的frida注入，程序运行的时候，如果我不输入flag，它会一直输出

![](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest/img/1749822241-image-1024x524.png)

这里的111111111是我在删掉的这一段里面加的

```
var connectPtr = Module.findExportByName("libc.so", "connect");
if (connectPtr) {
    Interceptor.attach(connectPtr, {
        onEnter: function(args) {
            var addr = args[1];
            var port = Memory.readU16(addr.add(2));
            if (port === 0x69A6  port === 0x6A6A) {
                this.block = true;
            }
        },
        onLeave: function(retval) {
            if (this.block) {
                retval.replace(-1);
            }
        }
    });
}
```

这表明只要程序在运行，这两段代码就会一直执行。我们跟进看一下反调试的那个地方，也可以发现它是无限循环，而且它是另起的线程，因此它会一直执行并检测frida

![](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest/img/1749822315-image.png)

而上面的代码的作用就是把反调试函数中读到的敏感字符串一直改变，也就是让这个if判断永远无法成立，所以它才是绕过反调试的核心，我注释掉的三段代码其实都没用。上面两个得不到执行，而下面那个是监听端口的，也就是反ida这类调试器动态调试的

绕过反调试后，下面的这部分便是真正的解密处

```
    MainActivity.C73ck19unt.implementation = function () {
        console.log("[+] Hooked C73ck19unt(), using fixed ciphertext as input");
        var arr_b = cipherBytes;
        var nativeInterface = this.nativeInterface.value;
        var decryptedArr = nativeInterface.Tralalerotralala.overload('[B', '[B', '[B').call(nativeInterface, 
            MainActivity.FIXED_KEY.value, 
            MainActivity.FIXED_IV.value, 
            arr_b
        );
```

这段代码直接把原程序的C73ck19unt，也就是check函数全部替换，原函数为

![](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest/img/1749823098-image-1024x416.png)

把它替换成了我们自己的解密函数，手动加载调用了内置的解密函数

我在比赛的时候一直想的是动态调试，但始终没绕过去，现在复现看看貌似即使我调上了好像也不太能做（ 因为那个twofish加密我也不认识。

这里再挖个坑（ 等有时间了再研究研究怎么动调，frida的做法确实简便，但以后可能会遇到要动态调试的题目，尤其它还是so这种动态链接库

## F\*\*K（复现）

纯纯密码题....... 完全没密码知识和代码能力（哭

是一个mac逆向题，没法动态调试，但是这里base64换表又出现了time随机数

![](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest/img/1749838355-image-1024x457.png)

比赛的时候我甚至去尝试装mac虚拟机（ 但无功而返，折腾半天最后也是没搞出来

这道题的加密逻辑挺简单：

原文->换表base64（更换后的表不知道）->base64编码后的密文每四个字节进行md5哈希变成16个字节，然后再通过运算：encrypt\_flag\[16 \* len + n16\] = (7 \* (encrypt\_flag\[16 \* len + n16\] ^ (n16 + 6)) + 0x1234 \* (n16 % 15)) % 256

我们现在手上有的是密文，由于在转md5那段有4字节到16字节，因此密文比较长

这里爆破的思路就是先爆破出来原文经过base64编码之后，在转md5之前的值，然后再用flag的前缀：H&NCTF爆出来表再得答案

至于爆破代码，还是学习了上面提到的师傅：[H&NCTF 2025 WriteUp 棱晶の小窝](https://astralprisma.github.io/2025/06/08/hn_25/) 用gpt重构了一下他的代码，这是爆破原文经过base64编码之后的代码：

import hashlib  
from itertools import product  
from multiprocessing import Pool, cpu\_count  
from tqdm import tqdm  

custom\_table = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"  

def generate\_all\_b64\_blocks(table):  
    return (''.join(p) for p in product(table, repeat=4))  

def transform(md5\_hash):  
    result = \[\]  
    for n16 in range(16):  
        val = (7 \* ((md5\_hash\[n16\] ^ (n16 + 6)) & 0xFF) + 0x1234 \* (n16 % 0xF)) % 256  
        result.append(val)  
    return bytes(result)  

def process\_block(block):  
    encoded\_block = block.encode()  
    md5\_hash = hashlib.md5(encoded\_block).digest()  
    transformed = transform(md5\_hash)  
    return (transformed, block)  

def build\_rainbow\_table(custom\_table):  
    blocks = list(generate\_all\_b64\_blocks(custom\_table))  
    total = len(blocks)  
    print(f"\[\*\] Generating rainbow table with {total} entries...")  

    pool = Pool(cpu\_count())  
    rainbow\_dict = {}  
      
    with tqdm(total=total, desc="Building Rainbow Table", unit="block") as pbar:  
        for result in pool.imap\_unordered(process\_block, blocks, chunksize=10000):  
            key, value = result  
            rainbow\_dict\[key\] = value  
            pbar.update()  
      
    pool.close()  
    pool.join()  
    print("Rainbow table built.")  
    return rainbow\_dict  

def decrypt\_num1(num1\_data, rainbow\_table):  
    b64\_string = ""  
    block\_count = len(num1\_data) // 16  

    for i in range(block\_count):  
        start = i \* 16  
        end = start + 16  
        block = num1\_data\[start:end\]  
      
        if block in rainbow\_table:  
            b64\_string += rainbow\_table\[block\]  
        else:  
            print(f"\[!\] Block {i} not found in rainbow table.")  
            b64\_string += "????"  
      
    return b64\_string  

def collapse\_overlapping\_windows(message: str, window\_size: int = 4) -> str:  
    _"""  
_ _从滑动窗口恢复原始_ _base64_ _字符串。_ _message:_ _所有__4__字节窗口拼接出来的字符串_ _return:_ _恢复的原始_ _base64_ _字符串_ _"""_ output = bytearray()  
    for i in range(0, len(message), window\_size):  
        if i == 0:  
            output += message\[i:i+window\_size\].encode()  
        else:  
            output.append(ord(message\[i+window\_size-1\]))  

    output\[-1\] = ord('=')  # 补一个 padding，防止 base64 报错  
    return output.decode()  

if \_\_name\_\_ == "\_\_main\_\_":  
    rainbow\_table = build\_rainbow\_table(custom\_table)  
    num1 = bytes.fromhex("8E681BB44AFA6C03C884467B469BE7BFE7F132B5DF3916FE3B8D902088D6BC040D5001699DE9EBEEEA63FE189D75014C59B1FF9363D8CE60FD211E4A5025F5F8968C3ABFD11318BD93C11088EAD50A7FD54A12DE52F0B1158938B76CB3374F8B795DA8FAD7ED6F1FF5F1C01B54BCF774DB4556CDC4E2A693FB097EF2235C915F9300E5F9278AADC17E18C6224BD7A6CA2F100A32105E59BEAE243E082A4DD1F56AFC5D84EAEB1B278352A0BB9DF40AA95530F1701653771B2C99179A70E24090C3B1EA924B3515145A30BF56306CF0304D5B097C74989E8872666C5C38A5760BA8EE7BF1B3AD582DBFA7331183467F1D1C9D861AC6D6B299CCC782ABED3A6B12A6F8BF1C3BEBDAE0610815018B2443CA154B1D9188BC5F9261370AA2D3309651AAA5D9505B823AAA1F77FF9CA64F2328E780088BE5CE1DFC0B6866BC5FFA44C25F0F0C861462D2F4A2E8CC9B274828AE5B76E8BCE03D8B844C29C8927FDC1EA680FF783FE1394BD0CCE013F7367CDD5C9602DCF9E9DD1887E9AC4326B3DF68C2FE3010B066DD046AFFD2FAE186EFA104BCADD1CE58A85D9D37517FCFF102BB4BB4161BBFE37105D41B5832E8592CCEE3D40B9E02F4A1343EF28FA39F7F24346E29246BFE8AB3E26C37E4EA7944F9A5285DCEAE7923862F9A00456E9F8711D10FE674BD7BE5812681EDD22A23E76F7D40D608EA781278B84F85E96C8B6DE78C14218A923FBA2D7968BEA20992D5B3FE7C4E5217E2AAEAECBD021D1C80AAF333BB65CBE51D96448F4E11696DA570984DBCD57CBF2C56131FF436B464FF520544023E15A0096912D151FF8A5A5BD0694B07678AE78F16A6401560E3DC628411085141B47ABA5A473429E776B1DAE3A829B679DAA5E2244113224667CB8DF684EC0EA8DE0E01AABFBC3AD00F8E658452BF43")  

    print(f"\[+\] num1 length: {len(num1)} bytes")  
      
    b64\_windows = decrypt\_num1(num1, rainbow\_table)  
    print("\[+\] Recovered sliding Base64 windows:", b64\_windows)  
      
    base64\_recovered = collapse\_overlapping\_windows(b64\_windows)  
    print("\[+\] Reconstructed Base64 string:", base64\_recovered)

思路很简单，我们用正常的base64表构造出来一个字典，然后把密文拿去和字典比对即可，构造的方式为：

取base64表中的四个字节字符（如'ABCD'），走一遍加密过程，然后把得到的密文和原字符加入进字典rainbow\_dict。这里共有64^4 = 16777216种可能，但爆的还算快

值得一提的是直接爆出来的并不是我们想要的，因为原题目这里是这样的：

![](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest/img/1749839023-image.png)

这个len每次就只+1而不是+4，也就是说它对那四个字符的操作是这样：

![](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest/img/1749839091-image-1024x469.png)

运行如下：

![](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest/img/1749838978-image-1024x123.png)

得到了原文被base64编码的密文，接下来只要搞到base64表就可以了，我们知道flag的前缀是H&NCTF{

那么就可以写爆破代码：

```
import time
import base64
import random

original_table = list("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/")


def generate_custom_table(seed):
    table = original_table.copy()
    random.seed(seed)
    v7 = random.randint(0, 0xFFFFFFFF) % 64
    for n59 in range(59):
        v5 = n59 + v7
        if v5 < len(table):
            table[n59], table[v5] = table[v5], table[n59]
    return ''.join(table)


# 已知的“加密后的 base64 字符串”
encrypted_b64 = "YIfUW7XMk7rrTcmnOYLPd63vg5S5S7BojdO/lr/1dt6="

# 爆破时间范围（过去1年内）
now = int(time.time())
for guess in range(now - 365 * 24 * 3600, now):
    custom_table = generate_custom_table(guess)

    try:
        # 使用自定义表还原 base64
        trans_table = str.maketrans(custom_table, ''.join(original_table))
        fixed_b64 = encrypted_b64.translate(trans_table)
        decoded = base64.b64decode(fixed_b64)
        if decoded.startswith(b"H&NCTF{"):
            print("[✅] FOUND SEED:", guess)
            print("Custom Table:", custom_table)
            print("Decoded:", decoded)
            break
    except Exception:
        continue
```

这段代码其实不能算完美，因为它爆的是时间戳（从去年到现在），而我是在Windows上运行的python，可能与这道题目的mac C背景中的rand生成机制不同，因此虽然它能爆出来，但我认为是凑巧，得到的时间戳也不是真的时间戳，但这道题就到这里，再细究细节我觉得也没意义

孩子们这就是密码题

## RealCrackMe（复现）

第一次见apk加壳

## C3（复现）