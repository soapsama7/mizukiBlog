---
title: 搭建自定义QQbot并接入maimai查分api的记录-萌新向
published: 2026-02-10 18:29:23
pinned: false
description: 尝试了一下搭建qqbot
tags: [Astrbot, qqbot]
category: QQbot
draft: false
---







玩了一个多月之后的补充（2026/3/22）：现在建议没相关基础的可以玩astrobot（上手和操作都很简单，但主要并不是做传统的那种服务式的qqbot，更偏向gpt、gemini那种对话式ai或者agent，因此这方面的生态不大，很多小功能小插件都没有），有一些编程基础且愿意折腾的可以玩nonebot2（这个是专门做传统的那种qqbot的，但上手和操作难度大一些，相对来说自由度更高，社区也更丰富）

---

只要有任何编程基础（没有应该也行？）就能看得懂因为我自己也是萌新（

# 失败记录

> 这一段是一开始用mirai搭的笔记，搭一半的时候发现登录问题解决不了，去搜了半天最后发现都去用onebot了.....于是临时改变了实现方案
>
> 但还是把这段留着吧

参考文章和博客地址：

[mamoe/mirai: 高效率 QQ 机器人支持库（mirai官方项目地址）](https://github.com/mamoe/mirai)

[mirai官方文档](https://docs.mirai.mamoe.net/)

[Mirai | 数据消散Wiki](https://wiki.mrxiaom.top/mirai)

[【QQ机器人】给纯新手的通俗易懂安装教程，长期接受评论私信答疑[基于mirai]（上） - 哔哩哔哩](https://www.bilibili.com/read/cv18489742/?opus_fallback=1)

---

寒假完全没学习的欲望，但也得找点事情做不能天天刷手机了（

很早之前就想自己整一个maimai的bot，但一直没什么时间加上自己太懒了，刚好现在来弄一下，顺便写个blog做记录。自己对这方面是0基础，简单搜了一下打算用mirai来搭建，不知道有没有更好的方案，先以这个入门吧



## 安装MCL

MCL即纯控制台的Mirai Console 启动器（Mirai Console Loader），可以在其Github项目地址里面下载。也有图形界面版本，但是那个不太稳定，所以这里用MCL。我这里下的版本为

![image-20260210154510879](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest//post/202602101545942.png)

中的`[mcl-installer-ae9f946-windows-x86.exe](https://github.com/iTXTech/mcl-installer/releases/download/ae9f946/mcl-installer-ae9f946-windows-x86.exe)`

安装的时候有两个选项确认

1. 是否安装Java环境
2. 确认安装MCL

如果你跟我一样电脑里有Java环境，第一条就别下了，不然可能会出现版本冲突之类的问题，没有的话就输入`Y`下一个

![image-20260210114938301](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest//post/202602101157595.png)

安装完是这样的

![image-20260210150355528](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest//post/202602101503585.png)

然后运行mcl.cmd，应当直接安装成功的。但这里我始终报错，然后崩掉

```
  15:38:42 [ERROR] Failed to fetch announcement for "org.bouncycastle:bcprov-jdk15on"
  15:39:24 [ERROR] Failed to fetch MCL announcement.
```

总之就是`org.bouncycastle:bcprov-jdk15on`这玩意下载失败，换代理换热点都没用。然后又是一顿乱搜，找到了解决办法，似乎是原来的**mcl 更新源**出问题了

打开文件夹里面的`config.json`配置文件，找到`mirai_repo`，把它改成`https://mcl.repo.mamoe.net/`就行

这里底下的`maven_repo`默认应该是阿里的镜像源，由于我基本上一直挂着梯子，就顺手给它改成了官方源（不知道这个不改会不会出问题）

然后再试试，成了

![image-20260210155013904](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest//post/202602101550972.png)

到这里为止MCL就算是安装完成了，这个东西仅仅是一个启动器，本身不带有其它功能。要实现其他功能还需要装很多相应的插件。文件夹中的各个文件表示的内容如下：
![image-20260210173540228](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest//post/202602101735300.png)

**将插件 JAR 放在 `plugins` 目录中，重启 Mirai Console 就会自动扫描并加载**



## 基本命令及插件

输入`/help`或者`help`查看命令，一些基本必要命令如下（`<>`为必填参数，`[]`为选填）：

1. 所有以/autoLogin 开头的为自动登录相关配置
2. /login <qq> [password] 登录一次此qq号
3. 所有以/permission 开头的为权限配置，简写为 /perm
4. /stop 退出程序，建议使用此方法退出MCL而不是直接点窗口的叉号，直接点叉号关闭会导致一些关闭时的存储数据功能不被运行，会影响使用

---

mirai属于模块化开发，本身不提供任何功能，要实现对应的功能就得去找插件

Mirai 官方只提供两个插件：

- [chat-command](https://github.com/project-mirai/chat-command): 允许在聊天环境通过以 "/" 起始的消息执行指令（也可以配置前缀）
- [mirai-api-http](https://github.com/project-mirai/mirai-api-http)：提供 HTTP 支持，允许使用其他编程语言的插件

这里以这两个插件为例，学习一下安装和使用插件

---

打开PowerShell，可以使用 MCL 自动安装这些插件，例如：

安装 mirai-api-http 的 2.x 版本：

```powershell
./mcl --update-package net.mamoe:mirai-api-http --type plugin --channel maven-stable
```

安装 chat-command：

```powershell
./mcl --update-package net.mamoe:chat-command --type plugin --channel maven-stable
```

好像已经装过了。。

![image-20260210174433004](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest//post/202602101744069.png)

注意：插件有多个频道，`--channel maven-stable` 表示使用从 `maven` 更新的 `stable`（稳定）的频道。不同的插件可能会设置不同的频道， 具体需要使用哪个频道可参考特定插件的说明 (很多插件会单独说明要如何安装它们, 因此不必过多考虑)。

社区插件在mirai官方论坛找：[插件发布 | MiraiForum](https://mirai.mamoe.net/category/11/插件发布)

---

# 正文

## 前置知识

搞mirai的时候还在疑惑，为什么搜到的教程都是三四年前的。。。。最后发现mirai项目已经停止维护了，现在甚至登录签名校验也很麻烦，而且大部分开发者也在迁移到OneBot生态

不过这一下午也没白费，算是了解了一下QQ消息发送的一些机制，也能明白自己到底要干什么了，这里先简单给出来用户和机器人交互的简图：

```
	   用户
        ↓
    QQ服务器
        ↓
协议实现（模拟QQ客户端，已登录）
        ↓
	OneBot事件
        ↓
	  后端
```

设想一下两个人正常地用QQ聊天，假设A是用户，B是我们部署好的机器人，A给B发送消息”你好“，那么：

”你好“会先被发送到qq服务器，然后qq服务器再把**包含”你好“的一段数据结构返回给B**，注意这里返回的实际上是一段数据结构，并不仅仅是一个字符串消息，那么这里就涉及到了第一个我们插入的元素：”协议实现“，常见的协议实现如下

- NapCat
- Lagrange
- mirai-core

协议实现实际上就是伪装成了一个qq客户端，和 QQ 服务器保持 **长连接**，负责解析数据结构成某种格式。这个特定的格式就称为**OneBot标准**，然后通过WebSocket或 HTTP POST 给后端，这个后端就是逻辑部分，可以自己写，也可以看看有没有大佬写过了，如果有直接装插件就行（  然后机器人回复用户就是逆向一下

按照后端那边的分层标准的话，这里的bot系统其实也可以分成三层：

① 协议层

负责：

- 登录
- 收发消息
- 过风控

例如：

- NapCat
- Lagrange

---

② 标准接口层

负责：

- 统一收发消息格式

例如：

- OneBot

---

③ 业务层

负责：

- 指令解析
- 自动回复
- 数据库
- 功能逻辑

例如：

- AstrBot
- 自己写 SpringBoot

## 安装Astrbot

[使用 Windows 一键安装器部署 AstrBot | AstrBot](https://docs.astrbot.app/deploy/astrbot/windows.html)

照抄没遇到错误，比上面的mirai好多了。。。

## 部署bot

正确安装后在webUI里面创建机器人，这里我OneBot v11和QQ官方WebSocket两种方式都试了一遍

### OneBot方式

用的是NapCat作为协议实现，看看官方文档：[使用 NapCat | AstrBot](https://docs.astrbot.app/deploy/platform/aiocqhttp/napcat.html)。或者说是这里：[Shell | NapCatQQ](https://napneko.github.io/guide/boot/Shell#napcat-shell-win手动启动教程)。跟着来就行，没什么bug

唯一要注意的地方（不会只有我犯蠢吧....）就是这里的`launcher_astrbot_en.bat`别删了，这就是启动器（一开始我以为这是安装程序来着，运行完就删了）![image-20260211012957927](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest//post/202602110129005.png)

然后接入astrbot，参考官方文档：[接入框架 | NapCatQQ](https://napneko.github.io/use/integration#astrbot)和[使用 NapCat | AstrBot](https://docs.astrbot.app/deploy/platform/aiocqhttp/napcat.html#连接到-astrbot)

![image-20260211011233284](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest//post/202602110112478.png)

以防有人跟我一样不知道NapCat的WebUI地址是多少找了半天。。（就在运行`launcher.bat`的命令行最上面那一部分）

![image-20260211014949359](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest//post/202602110149429.png)

然后照抄就成了

### QQ官方WebHook方式

这个方式必须得买服务器了，否则得上内网穿透，有点麻烦而且不稳定，等买了服务器再来看看（





## 加载maimai查分插件

经过前面几步已经搭建出来一个bot了，但要实现相应的功能还得添加一些插件，仪表盘里面就有插件市场

巧合的是居然就有查分的插件（  不用自己写代码去对接水鱼api了，项目地址：[ZhiheZier/astrbot_plugin_maimaidx](https://github.com/ZhiheZier/astrbot_plugin_maimaidx)，下载下来的插件在data/plugins目录下，跟着文档操作就行（必看插件文档，不然会报错的）![image-20260211202850816](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest//post/202602112028937.png)

如果在这里更新定数表和更新完成表的时候无论怎么搞都提示你不是超级管理员，建议重启整个bot和电脑再试试（  我这样就成了

还没成，这里更新完成表的话会报错：

```
 [20:42:14] [Core] [ERRO] [v4.15.0] [libraries.maimaidx_update_table:210]: Traceback (most recent call last):
  File "D:\QQbot\AstrBot\AstrBot\data\plugins\astrbot_plugin_maimaidx\libraries\maimaidx_update_table.py", line 125, in update_plate_table
    music_id_list = mai.total_plate_id_list[_ver]
                    ~~~~~~~~~~~~~~~~~~~~~~~^^^^^^
KeyError: '镜'
```

也就是镜代这个地方出了点问题，排查一下源代码，最终可以找到`astrbot_plugin_maimaidx`文件夹下的`__init__.py`代码中，可以看到这里

![image-20260211205145940](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest//post/202602112051349.png)

![image-20260211205310908](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest//post/202602112053312.png)

dx版本都是两个牌子，这里应该是镜&彩，去它远程请求数据的地方也可以看到是镜&彩（可以从上面的报错信息中排查代码得知)[yuzuchan.moe/api/maimaidx/maimaidxplate](https://www.yuzuchan.moe/api/maimaidx/maimaidxplate)

那么这里把镜改成镜&彩即可（毕竟国服也prism了....），然后就正常了

![image-20260211205716899](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest//post/202602112057980.png)

怕改错的话可以直接复制粘贴我的，已经通过测试了

```
import uuid
from pathlib import Path
from typing import Dict, List

from astrbot.api import logger

### 必须
log = logger
loga = logger

# BOTNAME 变量，会在插件初始化时从配置中读取并更新
_BOTNAME = "Bot"

def get_botname():
    """获取机器人名称"""
    return _BOTNAME

# 为了向后兼容，保留 BOTNAME 作为属性访问
# 其他模块应该使用 get_botname() 函数或通过模块访问 BOTNAME
BOTNAME = _BOTNAME


# 兼容 MessageSegment 类，避免依赖 hoshino 包
class MessageSegment:
    """兼容 hoshino.typing.MessageSegment 的类"""
    def __init__(self, type: str, data: dict):
        self.type = type
        self.data = data
    
    @staticmethod
    def image(file: str) -> 'MessageSegment':
        """
        创建图片消息段
        
        Args:
            file: 图片文件路径、URL 或 base64 字符串
        
        Returns:
            MessageSegment 对象
        """
        return MessageSegment('image', {'file': file})
    
    @staticmethod
    def text(text: str) -> 'MessageSegment':
        """
        创建文本消息段
        
        Args:
            text: 文本内容
        
        Returns:
            MessageSegment 对象
        """
        return MessageSegment('text', {'text': text})
    
    def __str__(self):
        return f"MessageSegment(type={self.type}, data={self.data})"
    
    def __repr__(self):
        return self.__str__()

public_addr = 'https://www.yuzuchan.moe/vote'


# ws
UUID = uuid.uuid1()

# echartsjs
SNAPSHOT_JS = (
    "echarts.getInstanceByDom(document.querySelector('div[_echarts_instance_]'))."
    "getDataURL({type: 'PNG', pixelRatio: 2, excludeComponents: ['toolbox']})"
)


# 文件路径
Root: Path = Path(__file__).parent
static: Path = Root / 'static'

arcades_json: Path = static / 'arcades.json'                    # 机厅
config_json: Path = static / 'config.json'                      # token
alias_file: Path = static / 'music_alias.json'                  # 别名暂存文件
local_alias_file: Path = static / 'local_music_alias.json'      # 本地别名文件
music_file: Path = static / 'music_data.json'                   # 曲目暂存文件
chart_file: Path = static / 'music_chart.json'                  # 谱面数据暂存文件
guess_file: Path = static / 'group_guess_switch.json'           # 猜歌开关群文件
group_alias_file: Path = static / 'group_alias_switch.json'     # 别名推送开关群文件
pie_html_file: Path = static / 'temp_pie.html'                  # 饼图html文件


# 静态资源路径
maimaidir: Path = static / 'mai' / 'pic'
coverdir: Path = static / 'mai' / 'cover'
ratingdir: Path = static / 'mai' / 'rating'
platedir: Path = static / 'mai' / 'plate'


# 字体路径
SIYUAN: Path =  static / 'ResourceHanRoundedCN-Bold.ttf'
SHANGGUMONO: Path = static / 'ShangguMonoSC-Regular.otf'
TBFONT: Path = static / 'Torus SemiBold.otf'


# 常用变量
SONGS_PER_PAGE: int = 25
scoreRank: List[str] = ['d', 'c', 'b', 'bb', 'bbb', 'a', 'aa', 'aaa', 's', 's+', 'ss', 'ss+', 'sss', 'sss+']
score_Rank: List[str] = ['d', 'c', 'b', 'bb', 'bbb', 'a', 'aa', 'aaa', 's', 'sp', 'ss', 'ssp', 'sss', 'sssp']
score_Rank_l: Dict[str, str] = {
    'd': 'D', 
    'c': 'C', 
    'b': 'B', 
    'bb': 'BB', 
    'bbb': 'BBB', 
    'a': 'A', 
    'aa': 'AA', 
    'aaa': 'AAA', 
    's': 'S', 
    'sp': 'Sp', 
    'ss': 'SS', 
    'ssp': 'SSp', 
    'sss': 'SSS', 
    'sssp': 'SSSp'
}
comboRank: List[str] = ['fc', 'fc+', 'ap', 'ap+']
combo_rank: List[str] = ['fc', 'fcp', 'ap', 'app']
syncRank: List[str] = ['fs', 'fs+', 'fdx', 'fdx+']
sync_rank: List[str] = ['fs', 'fsp', 'fsd', 'fsdp']
sync_rank_p: List[str] = ['fs', 'fsp', 'fdx', 'fdxp']
diffs: List[str] = ['Basic', 'Advanced', 'Expert', 'Master', 'Re:Master']
levelList: List[str] = [
    '1', 
    '2', 
    '3', 
    '4', 
    '5', 
    '6', 
    '7', 
    '7+', 
    '8', 
    '8+', 
    '9', 
    '9+', 
    '10', 
    '10+', 
    '11', 
    '11+', 
    '12', 
    '12+', 
    '13', 
    '13+', 
    '14', 
    '14+', 
    '15'
]
achievementList: List[float] = [50.0, 60.0, 70.0, 75.0, 80.0, 90.0, 94.0, 97.0, 98.0, 99.0, 99.5, 100.0, 100.5]
BaseRaSpp: List[float] = [7.0, 8.0, 9.6, 11.2, 12.0, 13.6, 15.2, 16.8, 20.0, 20.3, 20.8, 21.1, 21.6, 22.4]
fcl: Dict[str, str] = {'fc': 'FC', 'fcp': 'FCp', 'ap': 'AP', 'app': 'APp'}
fsl: Dict[str, str] = {'fs': 'FS', 'fsp': 'FSp', 'fsd': 'FSD', 'fdx': 'FSD', 'fsdp': 'FSDp', 'fdxp': 'FSDp', 'sync': 'Sync'}
plate_to_sd_version: Dict[str, str] = {
    '初': 'maimai',
    '真': 'maimai PLUS',
    '超': 'maimai GreeN',
    '檄': 'maimai GreeN PLUS',
    '橙': 'maimai ORANGE',
    '暁': 'maimai ORANGE PLUS',
    '晓': 'maimai ORANGE PLUS',
    '桃': 'maimai PiNK',
    '櫻': 'maimai PiNK PLUS',
    '樱': 'maimai PiNK PLUS',
    '紫': 'maimai MURASAKi',
    '菫': 'maimai MURASAKi PLUS',
    '堇': 'maimai MURASAKi PLUS',
    '白': 'maimai MiLK',
    '雪': 'MiLK PLUS',
    '輝': 'maimai FiNALE',
    '辉': 'maimai FiNALE'
}
plate_to_dx_version: Dict[str, str] = {
    **plate_to_sd_version,
    '熊': 'maimai でらっくす',
    '華': 'maimai でらっくす PLUS',
    '华': 'maimai でらっくす PLUS',
    '爽': 'maimai でらっくす Splash',
    '煌': 'maimai でらっくす Splash PLUS',
    '宙': 'maimai でらっくす UNiVERSE',
    '星': 'maimai でらっくす UNiVERSE PLUS',
    '祭': 'maimai でらっくす FESTiVAL',
    '祝': 'maimai でらっくす FESTiVAL PLUS',
    '双': 'maimai でらっくす BUDDiES',
    '宴': 'maimai でらっくす BUDDiES PLUS',
    '镜': 'maimai でらっくす PRiSM',
    '彩': 'maimai でらっくす PRiSM PLUS'
}
version_map = {
    '真': ([plate_to_dx_version['真'], plate_to_dx_version['初']], '真'),
    '超': ([plate_to_sd_version['超']], '超'),
    '檄': ([plate_to_sd_version['檄']], '檄'),
    '橙': ([plate_to_sd_version['橙']], '橙'),
    '暁': ([plate_to_sd_version['暁']], '暁'),
    '桃': ([plate_to_sd_version['桃']], '桃'),
    '櫻': ([plate_to_sd_version['櫻']], '櫻'),
    '紫': ([plate_to_sd_version['紫']], '紫'),
    '菫': ([plate_to_sd_version['菫']], '菫'),
    '白': ([plate_to_sd_version['白']], '白'),
    '雪': ([plate_to_sd_version['雪']], '雪'),
    '輝': ([plate_to_sd_version['輝']], '輝'),
    '霸': (list(set(plate_to_sd_version.values())), '舞'),
    '舞': (list(set(plate_to_sd_version.values())), '舞'),
    '熊': ([plate_to_dx_version['熊']], '熊&华'),
    '华': ([plate_to_dx_version['熊']], '熊&华'),
    '華': ([plate_to_dx_version['熊']], '熊&华'),
    '爽': ([plate_to_dx_version['爽']], '爽&煌'),
    '煌': ([plate_to_dx_version['爽']], '爽&煌'),
    '宙': ([plate_to_dx_version['宙']], '宙&星'),
    '星': ([plate_to_dx_version['宙']], '宙&星'),
    '祭': ([plate_to_dx_version['祭']], '祭&祝'),
    '祝': ([plate_to_dx_version['祭']], '祭&祝'),
    '双': ([plate_to_dx_version['双']], '双&宴'),
    '宴': ([plate_to_dx_version['双']], '双&宴'),
    '镜': ([plate_to_dx_version['镜']], '镜&彩'),
    '彩': ([plate_to_dx_version['镜']], '镜&彩')
}
platecn = {
    '晓': '暁',
    '樱': '櫻',
    '堇': '菫',
    '辉': '輝',
    '华': '華'
}
category: Dict[str, str] = {
    '流行&动漫': 'anime',
    '舞萌': 'maimai',
    'niconico & VOCALOID': 'niconico',
    '东方Project': 'touhou',
    '其他游戏': 'game',
    '音击&中二节奏': 'ongeki',
    'POPSアニメ': 'anime',
    'maimai': 'maimai',
    'niconicoボーカロイド': 'niconico',
    '東方Project': 'touhou',
    'ゲームバラエティ': 'game',
    'オンゲキCHUNITHM': 'ongeki',
    '宴会場': '宴会场'
}
```

然后查牌子完成表的话还得找水鱼那边要token填到static/config.json文件里面，自己申请一下就可以了（如果只是自己开发玩玩的话记得申请最低档，多一些请求次数的需要有一定服务规模才能申请到）



