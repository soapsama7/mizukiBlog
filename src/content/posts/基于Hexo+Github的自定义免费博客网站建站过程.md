---
title: 基于Hexo+Github的自定义免费博客网站建站过程
published: 2025-11-03 12:00:00
description: 萌新建个人博客的记录和教程（？
pinned: false
tags: [Hexo,博客]
category: 建站
---



2026/3/21补：因为hexo太老而且没啥好看的主题等之类的原因，已经迁移到了astro，这方面教程网上都有，我用的是mizuki主题：https://docs.mizuki.mysqil.com/

2026/4/22补：发现了一个特别喜欢的主题https://aza.moe/，但似乎是博主自己写的。经过他的允许后我用cursor抄了一个，感觉还行（
（这可能也是最后一次补了）

现在想建个人博客还是首选astro吧，毕竟hexo太老了（

---

之前的文章迁移过来又得去markdown里边改图片链接，虽然我把以前文章的图片移到Github图床了，但是也懒得去改以前的文章，所以之前的文章可能没有图片，不过也无所谓了，大多数都是一些CTF的wp（

自己以前用的是阿里云服务器+Wordpress建的博客，但碍于国内服务器又要备案、又要安全证书啥的，特别繁琐还要钱，于是干脆迁移到github，既免费又省事，而且最近正好在学web开发，也借此了解一些前端的相关知识。顺便写一篇文章记录一下基于Hexo+Github的建站过程，以及从我的原阿里云+Wordpress博客迁移过来的过程。因为自己也是萌新，大部分是照抄其他文章的，所以这篇文章其实不算严格的教程，更像一种记录，希望能帮到其他人:)

## 准备工作

需要先安装Git、Nodejs，以及准备一个github账号，然后创建一个github仓库，用于存储我们的博客网站代码，因为我们的博客相当于是托管在github上的，服务器都是借用的github，这部分详细教程网上都有，不再赘述。贴一个链接：
[GitHub Pages + Hexo搭建个人博客网站，史上最全教程_hexo博客-CSDN博客](https://blog.csdn.net/yaorongke/article/details/119089190)

大部分操作都是按照这个blog进行的

## 安装Hexo

搭建好仓库后，就要安装网站的相关框架，这里用的是Hexo，除此之外还有hugo、astro等框架

安装Hexo

```
npm install -g hexo-cli
```

这里如果报错失败，很有可能是因为npm没有权限访问相关文件夹等，这个原因一般是你在安装Nodejs的时候替换了它的缓存和下载地址，解决方法可以问下ai，算是比较简单

安装完之后，创建一个项目并初始化

```
hexo init hexo-blog
cd hexo-blog
npm install
```

然后把框架在本地启动

```
hexo g
hexo server
```

这样你就可以在本地访问你的博客了

![image-20251101195108462](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest//post/202511021500392.png)

这里展示的是Hexo的自带主题，接下来我们换一个主题

## 更换主题

我这里选的是Shoka，后面的操作也都是根据Shoka主题来设置的，如果你选的是别的主题，可能要自己根据相应主题的文档查询操作，Shoka主题的相关配置文档：
[Hexo 主题 Shoka & multi-markdown-it 渲染器使用说明 - Theme Shoka Documentation - 二进制杂谈 - 计算机科学 | Yume Shoka = 有夢書架 = 吾乃天，壶中之天](https://shoka.lostyu.me/computer-science/note/theme-shoka-doc/)

执行完前面的hexo安装操作后，找到安装好的文件夹，里面会有一个themes文件夹，主题就放在这里面，在这个文件夹里面执行命令：

```
git clone https://github.com/amehime/hexo-theme-shoka.git ./themes/shoka
```

先根据配置文档先配置相关的依赖插件，然后修改站点配置文件 /_config.yml ，把主题改为shoka

```
theme: shoka
```

现在再启动hexo并进入，就可以看到博客已经大变样了

![image-20251101211252478](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest//post/202511021500917.png)

这个主题用的插件、渲染等比较丰富，所以进去的时候有点慢。之后如果想更加个性化，可以看看上面的文档，里面有yml配置文件的各个说明，可以根据自己喜欢来配置，这里不赘述了

## 上传Github

当你在本地配置好相关配置项之后，就可以上传到Github了，这也是让blog能在公网访问的最重要的一步。这一步有很多种操作方法，我介绍一种我觉得比较方便的

如果你的电脑没有SSH key，先在cmd命令行运行：

```
ssh-keygen -t ed25519 -C "your_email@example.com"
```

一路回车即可，不要设置 passphrase（或者你可以设置，部署时可能需要输入）。默认会生成在 `~/.ssh/id_ed25519` 和 `~/.ssh/id_ed25519.pub`里面

然后把公钥添加到Github：打开 GitHub → Settings → SSH and GPG keys → New SSH key → 粘贴 `id_ed25519.pub` 内容

之后在本地运行：

```
ssh -T git@github.com
```

如果提示：Hi username! You've successfully authenticated... 就表示成功。这个相当于你电脑的一个标识，如果重装系统或者换电脑了，这里就要重新配一下

然后在Hexo的目录下的配置文件添加：

```
deploy:
  type: git
  repo: git@github.com:yourname/yourname.github.io.git
  branch: main
```

之后你再在本地修改了博客配置项的时候，就可以直接执行下列命令，上传到Github仓库：

```
hexo clean
hexo g
hexo d
```

访问我的网站：soapsama7.github.io
可以正常看到：

![image-20251102122631880](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest//post/202511021500560.png)

如果没有看到，多等一会或者重启下浏览器，这里可能要加载一段时间

## 搭建自己的图床

如果你是完全按照这个主题的教程来的，你会发现当博客部署到github服务器之后，所有的随机图片都消失了。

这是因为主题用的是渣浪图库，当你部署到网络上面后，这个图库会禁止你向他请求图片，所以图片都消失了

![image-20251102125624131](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest//post/202511021500996.png)

这个时候你可以按一下F12->网络，然后可以看到你的博客请求图片的时候，发生了403错误

这是一个比较正常的现象，如果你用网上的随机图片api，这个api有可能出问题，然后你的博客可能就访问不到了，搭一个自己的图床也是最省事，而且自定义程度也蛮高的，我是根据的这个教程：[体验PicGo+GitHub搭建图床，使用jsDelivr或Github raw免费加速 - 知乎](https://zhuanlan.zhihu.com/p/638224211)

照抄即可，这里仅写一些我遇到的问题和解决方式

这里我设置完PicGo，想上传一张图片试试，出现了

![image-20251102140008999](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest//post/202511021500714.png)

经过我的一阵排查，最终发现是我的Token有问题：PicGo **不支持 Fine-grained Token（细粒度 token）**，必须使用 **“classic token”**

而且需要勾选：然后选择：

- **repo**（必须，允许访问仓库内容）

- **read:user**（建议） 

- **workflow**（有时需要）

总算成功了

![image-20251102143457881](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest//post/202511021500798.png)

到这里这个图床算是创建完毕了，后面自己上传一些好看的图片，然后把博客的随机图片地址配到这里就可以，后面再讲，现在先设置一下Typora让文本中的图片通过PicGo上传到图床中，这是比较有必要的，因为在typora里面写的markdown的图片是保存在本地的，如果上传到服务器之后可能会因为访问路径错误导致看不到文件

在Typora的文件->偏好设置->图像里面设置成这样

![image-20251102145556958](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest//post/202511021455019.png)

然后需要注意，这里上传的图片也是上传到之前的Github仓库，为了不让我们文章的图片和我们的随机二次元图片混在一起，我们需要先打开PicGo的设置目录，路径一般是：

```
%APPDATA%\PicGo\data.json
```

粘贴到资源管理器就行，然后在picBed的下面添加配置：

```
"github-post": {
  "repo": "yourname/cdn_img",
  "branch": "main",
  "token": "xxxx",
  "path": "post/",
  "customUrl": "https://cdn.jsdelivr.net/gh/yourname/cdn_img@main"
}
```

这样就会在原来的仓库里面新建一个post文件夹，与前面的img文件夹分隔开，保证了两个文件夹的图片各有各的用途，不会搞混。保存后重启PicGo

如果你在这里上传失败了，Typora给你报错：Failed to fetch，请回到PicGo设置里面打开Server，并保证端口号是36677，之后就可以了



## 从WordPress迁移

我这里的迁移也就仅有文章部分，比较麻烦的地方就是原markdown文章的导出和相关媒体图片的导出

参考文章：[Wordpress 迁移至 Hexo - 知乎](https://zhuanlan.zhihu.com/p/64571154)

媒体库要登入宝塔面板后台，从后台的文件->wp-content->upload里面，选择你要下载的媒体文件，记得应该点”创建压缩“，不然找不到下载按钮，必须要先压缩再下载

![image-20251102163719540](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest//post/202511021637620.png)

参考上面的文章下载完之后，可以在本地博客文件夹的source/_posts里面发现文章已经导入了

接下来要做的是把以前的图片再传到自己现在的图床，然后修改一下相关markdown引用语法，这一步注意传图的时候一次少传一点，传多了电脑可能就炸了（

传完之后还要把以前的markdown文件里面的图片引用链接更改到现在的，这里不赘述了

## 添加友链、关于等页面

在博客根目录打开命令行，输入：

```
hexo new page "about"
hexo new page "friends"
```

然后会在`source/about/index.md` 和 `source/friends/index.md` 下生成模板文件，这里就是相关页面的描述信息md文件

这里需要保证主题的config配置文件里面有：

```
menu:
  首页: / || home
  关于: /about/ || user
  友链: /friends/ || heart
```

然后可以在博客根目录的**themes\shoka\example\source\friends**路径下找到主题作者放进去的示例代码，这里是友链的模板，可以自己修改，也可以直接用，有不懂的问问ai吧

关于页面就纯靠markdown美化修饰，不会的可以直接叫ai给一个代码（

## 域名变更

由于我之前的域名还在我以前那个阿里云服务器的博客，现在给它挪过来，我的域名也是在阿里云买的，因此下面的操作可能不适用于其他人

在阿里云的域名解析里面添加五条记录：

| 主机记录 | 记录类型 | 解析值             | TTL  |
| -------- | -------- | ------------------ | ---- |
| @        | A        | 185.199.108.153    | 默认 |
| @        | A        | 185.199.109.153    | 默认 |
| @        | A        | 185.199.110.153    | 默认 |
| @        | A        | 185.199.111.153    | 默认 |
| www      | CNAME    | yourname.github.io | 默认 |

等配置生效后，在你的博客仓库页面进入 **Settings → Pages → Custom domain**，然后在输入框填入域名，之后就要耐心等待一下

等一段时间后访问你的域名，如果能够进入到你的blog，就表明成功了，但是这里会有一个问题，如果你仅仅这样做了之后，你会发现每次hexo d上传一次文件，你的域名就会失效，要重新去绑一次

这是因为当你hexo d的时候，Hexo 会：

1. 删除远程仓库（GitHub Pages 仓库）里原来的所有内容；
2. 然后重新推送你本地生成的静态网页文件。

这个操作**会把根目录下的 `CNAME` 文件也删除掉**，而GitHub Pages 识别自定义域名就是靠仓库里的这个文件，因此每次上传把它删掉之后，你的域名就失效了

解决方法也很简单，自己在本地的博客根目录\source里面新建一个名字为CNAME的文件，内容只写一行，就是你的域名，之后再上传即可

