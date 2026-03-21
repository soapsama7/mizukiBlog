---
title: Parloo杯2025 Reverse wp
published: 2025-05-20 21:07:40
description: ParlooCTF2025线上赛 writeup
pinned: false
tags: [CTF,reverse]
category: ctfWriteup
---

逆向ak，但感觉自己代码阅读能力还是很差，耐心也不够，很多地方都是借助AI的

ps：不知道为什么图好像不见了，懒得再找了

### encrypted

简单异或，用前缀palu{猜一下异或数字

```
a='qcoq~Vh{e~bccocH^@Lgt{gtg'
for i in range(len(a)):
    print(chr(ord(a[i])^(i+1)),end='')
# palu{PosltionalXOR_sample}
```

### CatchPalu

![](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest/img/?code=MzNiYTM3OWNmZjEwODY4OWE0NDNmMTVhNzBkNDczMmJfa29wa05NS3VDQjJveVJDUmFkaFAwVjJoRWZqamltQTNfVG9rZW46QVhEbGJLdGZHbzJ6TEZ4NFpjemNXMkNRbnljXzE3NDc3NDY1MjU6MTc0Nzc1MDEyNV9WNA)

这一段hook了messageboxa的函数地址，在这段代码之后调用的messageboxa都会变成sub\_401360

动态调试看看

这里flag输入要输入附件里面的，也就是palu{P1au\_D0nt\_Bel1eve}，才能进入下面的messageboxa逻辑

进去就可以发现真正的比对函数，这里给硬编码的v8加密，似乎是魔改rc4，但不需要编写代码，直接进函数sub\_CE1270，等函数走完看v8内存就行

![](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest/img/?code=MGZhNzVkMTU0NmZjMTI1ZDBlZTgzMzRmZWU0ZmUwOWJfcEl5cmZJZG1CeG5GWlhDUktram9McGlLblBBWDlFMzRfVG9rZW46VjRIZ2JibFlnbzhnREx4d3dGSWM3YVRQbnZmXzE3NDc3NDY1OTg6MTc0Nzc1MDE5OF9WNA)

![](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest/img/?code=YzRiMDljNmUwZWM2YzMwYzM3MDVhZDM2NGM2ODdmOGZfVzU0eEo5a3A1UENtQ1NtTGtRYU9RYk5RazNmTlFDaUlfVG9rZW46RXBGRGJYSGVPbzI4NUF4YmtDeWM0Z0R0bmRkXzE3NDc3NDY1OTg6MTc0Nzc1MDE5OF9WNA)

ps：这里我做题的时候密钥被改变了，我当时手动修改回了forpalu，但这里复现写wp的时候密钥却是正确的，不知道什么情况...

### Asymmetric

又是一个go，长得很丑得耐心点看

![](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest/img/?code=N2YwNDE3NDk2NWJkMzQ2YzgyMzgzMTAzNmY0YTE0MDZfRjZNY21xSlRxRGhudkZ5cVkxTnhLbHdzMnVNanZDd1BfVG9rZW46QVdTcWJKalg2b2w0cXV4VjJGT2NRVGVIbjhiXzE3NDc3NDY2MDg6MTc0Nzc1MDIwOF9WNA)

动态调试慢慢分析，可以发现其实是一个rsa，数据都给了，但是要因式分解，随便找个网站分一下

![](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest/img/?code=OGU3ZDY1YWRmZDU2Y2U5ZTI4OWNhZDU1M2FjN2U5NWJfMTJjRjVWUVJIVEJLOHpHTjFlV2RxaTNUemt0dEVGSU5fVG9rZW46UW9qbWJZZXJ6b3pneGd4ZGpacGNaZjRlbko1XzE3NDc3NDY2MTE6MTc0Nzc1MDIxMV9WNA)

```
from Crypto.Util.number import inverse
N_str = "100000000000000106100000000000003093"
e = 65537
C_str = "94846032130173601911230363560972235"

N = int(N_str)
C = int(C_str)
p1 = 3
p2 = 47
p3 = 2287
p4 = 3101092514893
p5 = 100000000000000003
phi_N = (p1 - 1) * (p2 - 1) * (p3 - 1) * (p4 - 1) * (p5 - 1)
d = inverse(e, phi_N)

M = pow(C, d, N)
M_str = str(M)

print("计算出的输入字符串是:", M_str)
# 2279348573780051194351488552157565
a=2279348573780051194351488552157565
print(a.to_bytes(16,'big'))
# palu{3a5Y_R$A}
```

### PaluArray

简单的crackme，只不过函数长得很恶心

先根据字符串定位到主函数逻辑

![](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest/img/?code=Yzc1Yzg1ZjZhY2FkMDk5MTcxMGRjYjFlNmU4N2E2OWVfbkg5R0d3NEl3bDZDUElhZVVKOFU0a09vMWREaGpneEJfVG9rZW46QnA4c2I3RGZIb2tya294dUhUVWNUTkV5bmZkXzE3NDc3NDY2MjI6MTc0Nzc1MDIyMl9WNA)

其实就是要让v13=1145141919810

至于v13的生成逻辑，要看sub\_7FF6987E1994

![](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest/img/?code=OGRmNzM3ZGJhNTU1YTBhNjI1MzVkN2MzZGY5N2U5NjZfVVNLaUhRV1l0S3A3cXpQVmZ0V2IzUHFCMDNyNWRNQmFfVG9rZW46QUlqMGJZcHNZbzZWc3J4NzgzM2M1VkFBbm9iXzE3NDc3NDY2Mjg6MTc0Nzc1MDIyOF9WNA)

简单来说，就是根据传入的v4，在off\_7FF6987E9B48里找索引值

动态调试可以发现，v4其实就是我们输入的字符串，那么先解出来我们输入的字符串是什么

```
a=[0x50,0x61,0x6C,0x75,0x5F,0x39,0x39,0x36,0x21,0x3F]
b='1145141919810'
for i in b:
    print(chr(a[int(i,10)]),end='')
# aa_9a_a?a?!aP
```

把这个输入就得到flag了

![](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest/img/?code=ODlmZTgyMjFiZDgzNDU0ZjA5ZTZkYzEyMzI1NmY0NjJfSE45enp1Z0V4WHhzZEhvbVZZT013Nm54aHlFa0YxNmZfVG9rZW46VUxLcmI1eHZ6b2FKWFV4R2dDa2NiZE9VbjNjXzE3NDc3NDY2Mzg6MTc0Nzc1MDIzOF9WNA)

### PaluFlat

.com文件，用7zip解压，解压得到一个1g的文件，有点吓人。。。

不过主要逻辑不难

![](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest/img/?code=MTE2Yjg3ZDE1YjUwMGNkOWQyYTZiMTY4OGFiMWJhYmRfS3dyODg2bTVDaG56VHB0V3NYdEhHYkY2Z3hTeXdVS2ZfVG9rZW46S0tYZmJ2M2lVbzQxNmN4ZHlDaWNJZUZzbmZmXzE3NDc3NDY2NDg6MTc0Nzc1MDI0OF9WNA)

我们的输入经过函数401550加密，再与硬编码的密文比对即可

sub\_401550被控制流平坦化混淆，有些难看

但我把这个函数丢给ai它直接就分析出来了...运气还行

![](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest/img/?code=YmUzMzY2MjliNzI3YThkYmUyNDgyMTgyZjhhNGJhYzdfR21hcGNqTU9qVVR3MjBtNlAxRGZybHhZdnZBMHdRcHhfVG9rZW46TE5TMWJMOWh4b1FIUDF4S3NUSGNLQkFpbnJnXzE3NDc3NDY2NTI6MTc0Nzc1MDI1Ml9WNA)

```
enc=[0x54,0x84,0x54,0x44,0xA4,0xB2,0x84,0x54,0x62,0x32,0x8F,0x54,0x62,0xB2,0x54,0x3,0x14,0x80,0x43]
def decrypt(ciphertext):
    key1 = "palu"
    key2 = "flat"
    plaintext = []
    for i, c in enumerate(ciphertext):
        # 选择密钥
        key = key1 if i % 2 == 0 else key2
        k = key[i % len(key)]
        # 解密步骤
        v11 = ~c & 0xFF          # 取反（注意处理符号）
        v11 = (v11 + 85) & 0xFF  # 加 85
        v11 = ((v11 << 4)  (v11 >> 4)) & 0xFF  # 交换高低四位
        plaintext.append(chr(v11 ^ ord(k)))      # 异或密钥
    return ''.join(plaintext)

print(decrypt(enc))

# palu{Fat_N0t_Flat!}
```

### palugogogo

简单的go逆向，我用的ida9版本可以直接显示函数符号，不知道低版本的怎么样，go逆向就是函数长得太丑了很难看，但动态调试分析并不难

这里一开始有个反调试，hook掉返回值过掉就行

![](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest/img/?code=YWZiZDM0NmU4Nzc0MTY0ZDI5YWE1NWRiZDIxY2M5OGVfT1VTSlZJc0x4aDZBQXRLcHVyM24wVFBMY2dxREl3bldfVG9rZW46SFd4aWJzVDVSbzd5Ykt4cmZlMGM5SVVrbnVkXzE3NDc3NDY2NjM6MTc0Nzc1MDI2M19WNA)

具体比对逻辑在下面

![](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest/img/?code=MTQ0YmExN2I3MzI0ZGJhOTQ3NTlkOGI2Y2NhNDM5NzdfQngxNUJVOVFKSHhuVWc2V3AySUxqdXRybkRsS2RSdHFfVG9rZW46S1hmR2JLN0hLb3RHT1R4WFpYQmN2M08ybjRmXzE3NDc3NDY2NzE6MTc0Nzc1MDI3MV9WNA)

输入的flag经过encrypt这个函数加密，再与硬编码的密文比对，其中value与我们输入的无关，它是程序内部自生成的密钥，直接动调拿就可以，值是0x4F

至于这个加密也是耐心动调分析就能出，一开始我测试了一下，发现是逐字节加密，加密逻辑如下

```
a='palu{asdasdsajkhfjasf}'
value=0x4f
for i in range(len(a)):
    print(hex(ord(a[i])+value+(i%5)),end=',')
```

照着解密就可以

```
enc=[0xbf,0xb1,0xbd,0xc7,0xce,0x96,0x80,0x98,0x82,0x9a,0x7f,0xaf,0xc1,0xb3,0xbf,0xc4,0xcd]
value=0x4f
for i in range(len(enc)):
    print(chr(enc[i]-value-(i%5)),end='')
# palu{G0G0G0_palu}
```

### ParlooChecker

个人感觉最难的一道题，太考验耐心了

apk逆向，但jadx无法分析，转到jeb

![](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest/img/?code=NmUwODFkN2RlYjExMmU4MTA4YWFjY2E3MGZkNTgxMDFfVVR1N0NDaU1oVjI2cWpjRm4wQU1zUGJqWWc5eWFQaVpfVG9rZW46V3htZWJZWUt6b096c1N4SVVEOGM5SUJzbnliXzE3NDc3NDY2OTc6MTc0Nzc1MDI5N19WNA)

主要加密比对逻辑被藏在本地方法parloo里面，解压apk看一下so文件，so文件的导出表只有一个函数，就是oncreat3

![](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest/img/?code=ODZkZTI1ZDU4ZjMzOThiNzA3NzhmYmI5MWQyOTY4NGRfR3JQTW5zdkRjamQzcUYzNGE5Q2lzVkVYUHJybFdGZE9fVG9rZW46VzlVdWI2dlJwb0VocnZ4ZWlNdWNxa0gybmRkXzE3NDc3NDY3MTM6MTc0Nzc1MDMxM19WNA)

函数没任何符号，动调so文件又有些麻烦，只能一个个看了，前面的没什么用，直接看else部分

sub\_29390、sub\_291D0两个函数进行初始化，这部分使用rc4创建了后面加密要用的密钥，后面有很多函数都不用过多分析，大多起到混淆、分配内存或是格式化字符串作用

sub\_28D30里面藏了一个tea

![](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest/img/?code=NDk3MGU2MDExNzU5MmIwNTM3NDZjNGIyZWQyNmI0ZTFfOFJkamRCdm5vclB3akl0eVVGTVpDbFFYWVJOaTluVzBfVG9rZW46TDM3M2JBd3lib3VzdkJ4RUhxdGM2Nm9tbmdkXzE3NDc3NDY3MTc6MTc0Nzc1MDMxN19WNA)

大致逻辑如上，主要调用rc4生成密钥之类的，再调用tea加密原文，大多数函数都没有任何作用

ps：如果不用AI我可能要花更多时间。。。

```
import struct
import sys

a=[0x99,0xDD,0x56,0xFF,0x6D,0xD9,0x55,0x54,0x42,0x4D,0x79,0x1A,0x34,0xB7,0x81,0x2F]
UNK_10170 = b''
for i in a:
    UNK_10170+=i.to_bytes(1)
b=[0x87,0xC1,0x56,0xC0,0x4C,0xF4,0x63,0x4F]
UNK_10180 = b''
for i in b:
    UNK_10180+=i.to_bytes(1)
enc=[0xA9,0xB,0x5C,0x1C,0xA3,0x41,0x88,0xCA,0x66,0xD9,0x77,0x1D,0x78,0x3,0x8E,0x7A,0xBA,0x7B,0xD4,0x90,0xCD,0x50,0x7,0x83,0x41,0x4A,0x82,0x9C,0x79,0x1D,0xCC,0x6F,0x9D,0x2F,0x39,0x2D,0xA2,0xDA,0x83,0x1B]
TARGET_CIPHERTEXT = b''
for i in enc:
    TARGET_CIPHERTEXT+=i.to_bytes(1)
def rc4_ksa(key):
    """RC4 Key-Scheduling Algorithm (based on sub_2C740)"""S = list(range(256))
    j = 0
    key_bytes = key
    key_len = len(key_bytes)

    for i in range(256):
        j = (j + S[i] + key_bytes[i % key_len]) % 256
        S[i], S[j] = S[j], S[i]
    return S

def rc4_prga_sub_293E0(initial_S, input_data):
    """RC4 Pseudo-Random Generation Algorithm (based on sub_293E0 loop)"""S = list(initial_S)
    output_data = bytearray(len(input_data))

    v8 = 0
    v7 = 0

    for k in range(len(input_data)):
        v8 = (v8 + 1) % 256
        v7 = (v7 + S[v8]) % 256
        S[v8], S[v7] = S[v7], S[v8]

        keystream_index = (S[v7] + S[v8]) % 256
        keystream_byte = S[keystream_index]
        output_data[k] = keystream_byte ^ input_data[k]

    return bytes(output_data)

XTEA_DELTA_CONSTANT = 1640531527 # 0x61C88647

def calculate_encryption_v4_sequence(key_bytes):
    """计算加密轮次中 v4 值的序列。"""v4_sequence = [0]
    v4_current = 0
    k = [
        struct.unpack('<I', key_bytes[i*4 : i*4+4])[0]
        for i in range(4)
    ]

    for round_index in range(32):
        k2_index = round_index & 3
        k2 = k[k2_index]
        v4_update_term = (round_index ^ k2) - XTEA_DELTA_CONSTANT
        v4_current = (v4_current + v4_update_term) & 0xFFFFFFFF
        v4_sequence.append(v4_current)

    return v4_sequence

def decrypt_block_round(v6_end, v5_end, v4_start_of_round, v4_end_of_round, round_index, key_bytes):
    """解密定制 XTEA 变种的一轮。"""v6_end = v6_end & 0xFFFFFFFF
    v5_end = v5_end & 0xFFFFFFFF
    v4_start_of_round = v4_start_of_round & 0xFFFFFFFF
    v4_end_of_round = v4_end_of_round & 0xFFFFFFFF

    k = [
        struct.unpack('<I', key_bytes[i*4 : i*4+4])[0]
        for i in range(4)
    ]

    k3_index = (v4_end_of_round >> 11) & 3
    k3 = k[k3_index]
    intermediate_term2 = v6_end + ((v6_end >> 5) ^ (v6_end << 4))
    term2 = (k3 + v4_end_of_round) ^ intermediate_term2
    v5_start = (v5_end - term2) & 0xFFFFFFFF

    k1_index = v4_start_of_round & 3
    k1 = k[k1_index]
    intermediate_term1 = v5_start + ((v5_start >> 5) ^ (v5_start << 4))
    term1 = (k1 + v4_start_of_round) ^ intermediate_term1
    v6_start = (v6_end - term1) & 0xFFFFFFFF

    return (v6_start, v5_start)

def cbc_decrypt(ciphertext, key, iv):
    """使用定制 XTEA 变种以 CBC 模式解密密文。"""block_size = 8 # 字节
    if len(ciphertext) % block_size != 0:
        print(f"错误：密文长度 ({len(ciphertext)}) 不是分组大小 ({block_size}) 的倍数。无法执行 CBC 解密。")
        sys.exit(1)

    v4_sequence = calculate_encryption_v4_sequence(key)

    plaintext_bytes = bytearray()
    previous_ciphertext_block = iv

    for i in range(0, len(ciphertext), block_size):
        current_ciphertext_block = ciphertext[i : i + block_size]

        c0, c1 = struct.unpack('<II', current_ciphertext_block)

        decrypted_block_state = (c0, c1)

        for reverse_round_index in range(31, -1, -1):
             v4_start = v4_sequence[reverse_round_index]
             v4_end = v4_sequence[reverse_round_index + 1]

             decrypted_block_state = decrypt_block_round(
                 decrypted_block_state[0], decrypted_block_state[1],
                 v4_start, v4_end,
                 reverse_round_index,
                 key
             )

        p_prime_bytes = struct.pack('<II', decrypted_block_state[0], decrypted_block_state[1])

        plaintext_block = bytes([
            p_prime_bytes[j] ^ previous_ciphertext_block[j] for j in range(block_size)
        ])

        plaintext_bytes.extend(plaintext_block)

        previous_ciphertext_block = current_ciphertext_block

    return bytes(plaintext_bytes)
if not UNK_10170 or len(UNK_10170) != 16:
    print("错误：请提供 UNK_10170 的 16 字节数据，需从 SO 文件中提取。")
elif not UNK_10180 or len(UNK_10180) != 8:
     print("错误：请提供 UNK_10180 的 8 字节数据，需从 SO 文件中提取。")
elif not TARGET_CIPHERTEXT or len(TARGET_CIPHERTEXT) != 40: # <-- 检查长度为 40 字节
     print(f"错误：请提供 TARGET_CIPHERTEXT 的 **完整的 40 字节** 数据，需从 SO 文件中提取。")
     print(f"(当前提供的长度为 {len(TARGET_CIPHERTEXT)})")
else:
    print("占位符数据似乎已提供。尝试解密...")

    rc4_key_material = b"DoNotHackMe"
    S_box_for_73040 = rc4_ksa(rc4_key_material)
    KEY_QWORD_73040 = rc4_prga_sub_293E0(list(S_box_for_73040), UNK_10170)

    S_box_for_73050 = rc4_ksa(rc4_key_material)
    KEY_QWORD_73050 = rc4_prga_sub_293E0(list(S_box_for_73050), UNK_10180)

    print(f"派生出的加密密钥 (qword_73040): {KEY_QWORD_73040.hex()}")
    print(f"派生出的 IV (qword_73050): {KEY_QWORD_73050.hex()}")
    print(f"目标密文 (40字节): {TARGET_CIPHERTEXT.hex()}")

    decrypted_padded_plaintext = cbc_decrypt(TARGET_CIPHERTEXT, KEY_QWORD_73040, KEY_QWORD_73050)

    plaintext = decrypted_padded_plaintext.rstrip(b'\x00')

    print(f"\n解密后的填充明文 (40 字节): {decrypted_padded_plaintext.hex()}") # <-- 输出提示长度为 40

    try:
        flag = plaintext.decode('utf-8')
        print(f"恢复的 Flag (解码为 UTF-8): {flag}")
    except UnicodeDecodeError:
        print(f"无法将恢复的明文解码为 UTF-8。")
        print(f"恢复的明文字节 (十六进制): {plaintext.hex()}")
    except Exception as e:
        print(f"在最终处理过程中发生未知错误: {e}")

# palu{thiS_T1Me_it_seeM5_tO_8e_ReAl_te@}
```

### Game

迷宫，bfs求解最短路径

![](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest/img/?code=NTg5YzU3N2JmNzlhNTJmZjQxMDUzMzM5MmI2OTNjNjJfbnF1UnJoR3BIczJPZVE5ZGNYdE1PSWRnTzNJRzRYSW5fVG9rZW46RjZOZWJxTTJTb05JZUZ4dVJkUWNkT3J4bkhiXzE3NDc3NDY3Mjc6MTc0Nzc1MDMyN19WNA)

但这道题明显多解，我最开始写的那个代码死活不对（其实也是AI给的）。。。

然后叫ai给我出了一个全解代码（一开始是128个答案，但题目后面给的hint把范围缩小到64个了）

```
import collections
import itertools
import hashlib

# Keep the original BFS to get distances, but modify it slightly or create a new one
# to just compute the distance grid efficiently.
def bfs_get_dist_grid(grid, start):
    """    使用 BFS 计算从 start 到所有可达点的最短距离，并返回距离网格。    """rows = len(grid)
    cols = len(grid[0])
    dist = [[float('inf') for _ in range(cols)] for _ in range(rows)] # 使用 inf 表示不可达或未访问

    queue = collections.deque([(start[0], start[1])]) # (row, col)
    dist[start[0]][start[1]] = 0

    dr = [-1, 1, 0, 0] # 方向：上, 下, 左, 右
    dc = [0, 0, -1, 1]

    # 可行走的字符集合 (保持与之前一致)
    walkable_chars = {'0', ' ', 'X', 'Y'}

    while queue:
        r, c = queue.popleft()

        for i in range(4):
            nr, nc = r + dr[i], c + dc[i]

            if 0 <= nr < rows and 0 <= nc < cols and grid[nr][nc] != '#' and dist[nr][nc] == float('inf'):
                dist[nr][nc] = dist[r][c] + 1
                queue.append((nr, nc))

    return dist # 返回完整的距离网格

def get_all_shortest_paths(grid, start, end, dist_grid):
    """    给定距离网格，递归回溯从 start 到 end 的所有最短路径。    """if dist_grid[end[0]][end[1]] == float('inf'):
        return [] # 如果终点不可达

    all_paths = []

    # 递归回溯函数
    def collect_paths(current_node, path_so_far):
        r, c = current_node

        if (r, c) == start:
            all_paths.append(list(reversed(path_so_far + [current_node]))) # 到达起点，添加完整路径 (反转)
            return

        # 探索邻居，只回溯到距离小 1 的邻居 (即在最短路径上)
        dr = [-1, 1, 0, 0]
        dc = [0, 0, -1, 1]

        for i in range(4):
            pr, pc = r + dr[i], c + dc[i] # Parent row/col

            # 检查边界
            if 0 <= pr < len(grid) and 0 <= pc < len(grid[0]):
                # 确保是从距离小 1 的点过来的
                if dist_grid[r][c] == dist_grid[pr][pc] + 1:
                     # 检查这个点不是障碍
                     if grid[pr][pc] != '#':
                        collect_paths((pr, pc), path_so_far + [current_node]) # 递归回溯

    # 从终点开始回溯
    collect_paths(end, [])

    return all_paths # 返回所有找到的最短路径坐标列表


def coords_to_wasd(path_coords_list):
    """    将坐标路径列表转换为 WASD 字符串。 (与之前相同)    """wasd_string = ""
    for i in range(len(path_coords_list) - 1):
        r1, c1 = path_coords_list[i]
        r2, c2 = path_coords_list[i+1]

        dr = r2 - r1
        dc = c2 - c1

        if dr == 1:
            wasd_string += 'S' # 向下
        elif dr == -1:
            wasd_string += 'W' # 向上
        elif dc == 1:
            wasd_string += 'D' # 向右
        elif dc == -1:
            wasd_string += 'A' # 向左

    return wasd_string

# 您提供的已经替换空格的迷宫地图字符串
maze_string_0_filled = """
##############################0#
#Y#0000000000000000000#0000000X
#0#0#############0###0#0###0##0#
#0#000#000000000#0#000#000#000##
#0#####0#######0###0#0###0###0##
#000#000#00000#0#000#000#0#000##
###0#0###0#####0#0#######0#0####
#0#000#0#00000#0#00000#000#000##
#0#####0#0###0#0#0###0#0#####0##
#000000000#000#0#000#0000000#0##
#0#########0#0#0#############0##
#000#0#00000#0#000#00000000000##
###0#0#0#########0#0#########0##
#0#0#0#00000000000#0#0000000#0##
#0#0#0#############0#0#####0#0##
#000#0000000#0000000#0#000#000##
0X0##0###0###0#0#####0#0########
#000#000#00000#000#0#0#000#000##
###0###0#########0#0#0#0#0#0#0##
#0#0#000#000#000#0#0#0#0#0#0#0##
#0#0###0#0#0#0#0#0#0#0###0#0#0##
#0#000#0#0#000#000#000#000#0#0##
#0###0###0###########0#0#0#0#0##
#000#000#00000000000#0#0#0#0#0##
#0#####0#0#########0#0#0###0#0##
#000#000#000#0000000#0#0#000#0##
###0#0#######0#######0#0#0###0##
#000#000#000#0#00000#0#000#000##
#0#####0#0#0#0#0#####0#####0#0##
#000000000#000#0000000000000#00#
0X0############0X0###########0X
#0##############0#############0#
"""

# --- 解析迷宫字符串到网格 ---
lines = maze_string_0_filled.strip().split('\n')
grid = []
expected_cols = 32

for i, line in enumerate(lines):
    if len(line) < expected_cols:
        processed_line = line.ljust(expected_cols, '0')
    elif len(line) > expected_cols:
         processed_line = line[:expected_cols]
    else:
        processed_line = line
    grid.append(list(processed_line))

rows = len(grid)
cols = len(grid[0]) if grid else 0
print(f"解析后的迷宫尺寸: {rows}x{cols}")

# 在网格中找到起始点 'Y' 和所有出口 'X' 的坐标
start_coord = None
exit_coords = []

for r in range(rows):
    for c in range(cols):
        if grid[r][c] == 'Y':
            start_coord = (r, c)
        elif grid[r][c] == 'X':
            exit_coords.append((r, c))

print(f"在地图中找到的起始点 Y: {start_coord}")
print(f"在地图中找到的出口点 X: {exit_coords} (共 {len(exit_coords)} 个)")

# 在继续之前，验证是否找到一个 Y 和 5 个 X
if start_coord is None:
    print("\n错误：未在地图中找到起始点 Y。")
elif len(exit_coords) != 5:
     print(f"\n错误：在地图中找到的出口数量不为 5 个，而是 {len(exit_coords)} 个。无法进行计算。")
else:
    print("\n成功在地图中找到所有关键点 (1个 Y, 5个 X)。正在计算关键点之间的最短路径距离...")

    # 预先计算所有关键点对之间的最短距离
    points = [start_coord] + exit_coords
    dist_data = {} # 存储 ((p1_r, p1_c), (p2_r, p2_c)): distance

    # 为了获取所有路径，我们需要从每个起点运行 BFS 来获取距离网格
    # 存储从每个关键点出发的距离网格
    dist_grids = {}
    for p in points:
         dist_grids[p] = bfs_get_dist_grid(grid, p)

    # 填充 dist_data 使用计算好的距离网格
    for i in range(len(points)):
        for j in range(i + 1, len(points)):
            p1 = points[i]
            p2 = points[j]
            # 从 p1 出发的距离网格中查找 p2 的距离
            dist = dist_grids[p1][p2[0]][p2[1]]
            if dist != float('inf'):
                 dist_data[(p1, p2)] = dist
                 dist_data[(p2, p1)] = dist # 距离是双向的


    # 找到访问所有出口的最短总路径 (从 Y 开始，遍历所有 X)
    min_total_dist = float('inf')
    optimal_permutations = [] # 存储所有达到最小距离的出口访问顺序

    print("\n正在查找访问所有出口的最短总距离...")

    for perm in itertools.permutations(exit_coords):
        current_total_dist = 0
        current_point = start_coord
        valid_permutation = True

        # 计算当前排列顺序的总距离
        for next_point in perm:
            pair = (current_point, next_point)
            if pair not in dist_data:
                 valid_permutation = False
                 break # 某段不可达

            current_total_dist += dist_data[pair]
            current_point = next_point

        if valid_permutation:
            if current_total_dist < min_total_dist:
                min_total_dist = current_total_dist
                optimal_permutations = [perm] # 找到更短的，清空并记录新的
            elif current_total_dist == min_total_dist:
                optimal_permutations.append(perm) # 找到同样短的，添加记录

    print(f"\n计算出的访问所有出口的最短总路径距离 (从 Y 开始): {min_total_dist} 步。")
    print(f"提示的最短路径距离: 290 步。")

    if min_total_dist == 290:
        print("计算结果与提示相符！正在生成所有最短路径的 WASD 序列...")

        all_shortest_wasd_paths = set() # 使用集合存储唯一的 WASD 序列 (大写)

        # 现在为每个达到最短总距离的排列组合生成所有可能的路径
        for opt_perm in optimal_permutations:
             segment_paths_lists = [] # 存储每个路径段的所有最短路径列表

             current_point = start_coord
             # 对于排列中的每个段 (Y -> X1, X1 -> X2, ...)
             for next_point in opt_perm:
                 # 从当前点的距离网格中获取该段的所有最短路径
                 segment_dist_grid = dist_grids[current_point]
                 # 调用新的函数获取所有路径
                 all_segment_paths = get_all_shortest_paths(grid, current_point, next_point, segment_dist_grid)
                 if not all_segment_paths:
                      segment_paths_lists = []
                      break
                 segment_paths_lists.append(all_segment_paths)
                 current_point = next_point

             if segment_paths_lists:
                 # 使用 itertools.product 组合所有路径段的所有可能组合
                 for path_combination in itertools.product(*segment_paths_lists):
                     combined_path_coords = []
                     for i, segment_path in enumerate(path_combination):
                         if i == 0:
                             combined_path_coords.extend(segment_path)
                         else:
                             combined_path_coords.extend(segment_path[1:])

                     wasd_path = coords_to_wasd(combined_path_coords) # 生成大写 WASD 路径
                     all_shortest_wasd_paths.add(wasd_path)

        # --- 筛选路径 (最后四步 SS DS), 转小写, 计算 MD5 ---
        filtered_md5s = []
        filter_suffix_uppercase = "SSDS" # 筛选条件 (大写)

        print(f"\n过滤路径：寻找最后四步为 '{filter_suffix_uppercase}' 的路径...")

        # 遍历所有找到的最短路径 (大写)
        for wasd_path_uppercase in all_shortest_wasd_paths:
            # 检查路径是否足够长且以指定的后缀结束
            if len(wasd_path_uppercase) >= len(filter_suffix_uppercase) and wasd_path_uppercase.endswith(filter_suffix_uppercase):
                # 将符合条件的路径转为小写
                wasd_path_lowercase = wasd_path_uppercase.lower()
                # 计算小写路径的 MD5 哈希值
                md5_hash = hashlib.md5(wasd_path_lowercase.encode('utf-8')).hexdigest()
                filtered_md5s.append(md5_hash)

        # 排序筛选后的哈希值以便输出顺序稳定
        sorted_filtered_md5s = sorted(filtered_md5s)


        print(f"\n共找到 {len(sorted_filtered_md5s)} 条长度为 {min_total_dist} 且最后四步为 '{filter_suffix_uppercase}' 的唯一最短路径。")
        print("这些路径（转为小写后）的 MD5 哈希值如下：")

        for i, md5_hash in enumerate(sorted_filtered_md5s):
            print(f"Filtered Path {i+1} MD5: {md5_hash}")

        print("\n对应的达到最短总距离的出口访问顺序 (从 Y 出发) 可能有:")
        point_names = {start_coord: 'Y'}
        for i, coord in enumerate(exit_coords):
             point_names[coord] = f'X{i+1}'

        for i, opt_perm in enumerate(optimal_permutations):
             path_points_sequence = [start_coord] + list(opt_perm)
             print(f"顺序 {i+1}: " + " -> ".join([f"{point_names.get(c, str(c))}{c}" for c in path_points_sequence]))


    else:
        print("计算结果与提示不符，请检查地图、坐标或算法实现。")
        print("\n未能找到访问所有出口的有效路径或最短距离不为290。")
```

一个个试，试到第41个对了

![](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest/img/?code=ZTI2YmIxMzdiNDc3Mjc0NTAwYjM0NjA3ZWQzZWY1NTlfS3Y1MGE3NkJRRzlQeTFqcmw5ZVVZVG91dTNBTWhpYzlfVG9rZW46VVkza2J1T0dob0RvTkx4VEtBeGNZTEFmblRnXzE3NDc3NDY3NTc6MTc0Nzc1MDM1N19WNA)

palu{990fd7773f450f1f13bf08a367fe95ea}