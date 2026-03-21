---
title: SAST-ReadTrack项目练习
published: 2025-10-07 20:25:01
description: 简单的小项目
pinned: false
tags: [Java,Web后端]
category: Web后端
---

校科协的免试题，做的时候除了Git其它的都学习过了，但没有实战做过具体的项目，借助ChatGPT完成，代码的AI味可能有点浓......

完成后的项目地址：[](https://github.com/soapsama7/SAST-ReadTrack)[soapsama7/SAST-ReadTrack at dev-soapsama](https://github.com/soapsama7/SAST-ReadTrack/tree/dev-soapsama)

欢迎各位大佬来指出问题和拷打（

## 项目需求分析和准备工作

文档中给了一个项目仓库，里面提供了模板代码，只需要照着github仓库里面提供的模板代码和文档需求完成相应的业务逻辑即可

先用git clone把项目仓库拷贝到本地，但这里网有点抽风，第一次失败了，改一下代理就行

![](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest/img/1759374243-image-1024x369.png)

还得新建一个自己的本地分支，方便代码管理

![](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest/img/1759375998-image.png)

然后用IDEA创建一下数据库，再运行文档里给的SQL语句，创建出来user和book表，这里犯了点糊涂

IDEA里面最上层的是数据源，相当于告诉IDEA要访问哪台数据库服务器，在服务器下面才是各个数据库，只创建数据源就运行SQL语句会报错的  

![](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest/img/1759375211-image.png)

![](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest/img/1759375192-image.png)

建完之后打算去application.yml里面导入一下的时候才发现项目里面有创建sql的全套操作........

![](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest/img/1759375430-image-1024x544.png)

到这里为止，准备工作已经完成了，接下来开始写业务逻辑

## 必做部分

### 基础用户部分

根据标准，完善了一下Controller、Service、Mapper三层的代码

![](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest/img/1759388987-image.png)

Controller层有一个注册和一个登录方法，返回值都用了Spring提供的类ResponseEntity作为HTTP请求的返回值，响应体用Map键值对集合封装一系列键值对，同时用try-catch语句为两个方法的结果做了不同处理。这里登录验证的session机制我没有学习过，这里了解了一下：

![](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest/img/1759393676-image.png)

![](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest/img/1759393803-image-1024x464.png)

其实就是因为HTTP请求它是无状态的，而登录这个操作是需要保存的有状态操作，那么服务端那边就用session这个机制来保存用户的id，登录之后把它返回给客户端的cookie。之后客户端的每次请求都会自动携带这个id传到服务端，服务端那边看到这个id就知道是哪个用户，也就能执行对应的操作了

entity里面的user和book类仅仅给了成员变量，我自己引入了lombok依赖，在上面加了@Date等注解，自动生成get、set等方法和构造方法等

Service层有几个注解我之前没见过，这里总结一下

![](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest/img/1759394486-image.png)

![](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest/img/1759394558-image.png)

其中有注意点，在现在这个项目里面的Resource（由JDK提供）可以和Autowired（由spring提供）互换，但它们实际上有些区别，这里涉及到Bean的名字来源

![](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest/img/1759395029-image.png)

也就是说在现在这个项目代码里面，这里的”private UserMapper userMapper“ 属性名就是userMapper，而userMapper接口的名字也是这个，和Bean的名字一致，可以直接找到，但如果把userMapper换成”Mapper“之类的，根据名字找就会失效。而Resource就是优先根据变量的名字来找有没有Bean和它一样的，如果没有再根据类型找。Autowired则是直接根据类型找，若类型多了就直接报错，必须指定名字。

不过现在这个项目代码里面只有一种类型的接口，没有相应的实现类，所以无论用哪个注解都只会找到MyBatis生成的那个代理对象（由Mapper注解完成）而已，因此用哪个都无所谓

到这为止用户部分的基本操作就弄完了，git commit一下

![](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest/img/1759397562-image-1024x451.png)

后来经过测试发现还没有弄完，这里的User有四个属性值，注册的时候如果只给username和password的话，createAt那里是null

我一开始的想法是在Service层返回之前手动添加一下LocalDateTime.now()来指定一下当前时间，但这里我突然想到了之前仓库提供的建表语句似乎指定了默认时间，看了一下确实如此

![](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest/img/1759413260-image.png)

但实际上在测试的时候并没有传入，这是为什么？

检查了一下Mapper层的代码，发现是insert方法出了点问题，这里不应该传入created\_at参数，因为这里的参数是我们提交的user用户类，此时这里就是null，如果把它作为参数再赋值回去，那么这里的created\_at就有了值：null，此时建表语句的默认指定就会失效

![](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest/img/1759413084-image.png)

把这个参数去掉就可以正常插入时间了

还有值得一提的是这里在本地浏览器测试的时候会先强制重定向到一个登录界面，但这个不是我写的，问了一下ai，发现是pom.xml里面引入的一个依赖  

![](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest/img/1759413438-image.png)

它的默认用户名是user，密码会在每次运行的时候随机生成，必须要先登录进去之后才能正常访问我写的代码逻辑

不知道这个依赖有什么用，文档里也没写，我就把它注释掉了，注释之后测试注册和登录逻辑看起来没什么问题，就到这里吧

### 基础书籍管理部分

这一部分我放在登录验证之后，每一个用户都对应自己可以操作的图书，因此Controller层的每一个方法都要用(session.getAttribute("user")).getId()，即session机制来获得对应用户再操作

回忆一下几个注解：  

![](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest/img/1759416738-image-1024x428.png)

![](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest/img/1759416748-image.png)

这里更改页数的相关service层代码，ai一开始给我的很复杂，而且我觉得校验逻辑不够充分，自己修改了一会，最终改成了下面这样：

![](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest/img/1759463481-image.png)

我在Mapper层添加了一个根据书籍id和用户id查询书籍的方法，这样就能查到一个唯一的书籍。若它不存在，那么直接抛出异常，所存在则可以直接对这个对象进行操作，下面的更新书籍状态也用的是这种方式

ai一开始给的代码是这样：  

```
@Override
@Transactional
public boolean updateReadProgress(Long bookId, Integer currentPage, Long userId) {
    if (currentPage == null  currentPage < 0) {
        throw new RuntimeException("页数不合法，请重试");
    }

    Book book = new Book();
    book.setId(bookId);
    book.setUserId(userId);
    book.setCurrentPage(currentPage);

    return bookMapper.updateReadProgress(book) > 0;
}
```

Controller层也有点小改动，这里不赘述了

为了实现分页查询，这里引入了一个PageHelper依赖，它是Mybatis的一个分页插件，只要传入起始页码和每页的数据数量，它就会自动帮我们改SQL语言，不用动xml映射文件，只在Controller层和Service层改动一下即可

![](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest/img/1759476404-image.png)

![](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest/img/1759476326-image.png)

后面的详细查询我做了模糊处理，前端传进来的keyword可以是作者名，也可以是书籍名

![](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest/img/1759477236-image.png)

### 测试部分

这个项目没给前端页面，我用了postman测试

先访问api/user/register随便注册一个testuser，注册完之后可以看到已经保存到数据库了

![](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest/img/1759803094-image.png)

且当程序运行结束后用户依然存在

接下来访问/api/user/login登录，假设这里不登录而直接操作书籍，会导致：

![](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest/img/1759803398-image.png)

这表示没有登录

登录后添加书籍，却发现如下情况  

![](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest/img/1759803172-image-1024x614.png)

问了下GPT，这里是数据库那边更新数据的时候出了问题，具体原因是**数据库的 `status` 列类型（ENUM）和 Java 传入的数据类型（int）不兼容。**

这里项目给的建表语句为“status ENUM('0', '1', '2') NOT NULL DEFAULT '0' -- 阅读状态:0未读 1阅读中 2已读”，所以这里的status要接收的是字符串，而不是int整型，但项目提供的Book类这里的成员status却是整形定义，把它改成String类型，再修改一下Service里面的setStatus方法即可

![](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest/img/1759803650-image.png)

修改完成后再测试：

![](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest/img/1759803710-image-1024x481.png)

可以看到数据库里面也正常出现数据：  

![](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest/img/1759803740-image-1024x79.png)

进度更新也正常：

![](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest/img/1759805185-image-1024x614.png)

但是这里的status却没有按照代码正确修改，检查了一下发现是SQL语句那里并没有修改status，添加一下

![](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest/img/1759805428-image.png)

再次测试之后发现还是不行，status的状态和currentpage没法统一

这里找了半天问题也没找出来，似乎是建表语句那里的枚举和我java里面的String的数据问题？这里没搞太懂。

最后找到的解决办法是，把Book类的status再变回Integer，但是修改MySQL里面的status类型为tinyint，这样数据类型统一了，只要在代码里面严格限制只能为0、1、2三个数字就行，这下逻辑没问题，当修改currentPage的时候，status也会根据其正确修改

![](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest/img/1759807020-image.png)

接下来的updateStatus方法依然出现了修改status之后，current\_page没有改变的问题，原因和之前一样，没有在SQL语句里面修改current\_page，这里添加一下即可。且这里在Service层再添加一段判断

![](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest/img/1759807250-image.png)

保证数据逻辑正确对应

接下来的deleteBook、getUserBooks、getBooksByStatus没什么问题，可以直接跳过  

![](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest/img/1759807391-image-1024x765.png)

然后这里的searchBooks，可以正确查询到对应书籍，但是有一个小问题

![](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest/img/1759807569-image-1024x790.png)

![](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest/img/1759807611-image-1024x780.png)

![](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest/img/1759807625-image-1024x829.png)

具体问题就是，当返回为空的时候，我的java代码写的是

![](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest/img/1759807674-image.png)

这个输出无法返回到前端页面，在postman里面表现为一个空的数据，这个输出只会在控制台上面输出

一开始我打算把这个方法的返回值也改为ResponseEntity<Map<String, Object>>，然后作为HTTP请求响应，但想了一下似乎不需要，连books是否为空也不需要验证，直接返回空值也是一种合理的逻辑

测试到这里，感觉相关的增删查改逻辑都已经完成，没什么大问题了

## 选做部分

其它三部分没什么好说的，前面其实都完成了，安全增强这里多注意了一下

动代码之前先git commit一下

![](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest/img/1759809911-image-1024x131.png)

![](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest/img/1759809426-image.png)

![](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest/img/1759809436-image.png)

BCrypt似乎理论上可能出现哈希碰撞，但安全性却很高

![](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest/img/1759809491-image-1024x614.png)

这里要把前面我注释掉的依赖加回来

![](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest/img/1759809595-image.png)

然后修改一下Service层的代码，Controller层不用动，接下来测试一下

这里如果把这个依赖又加回来了，会触发一个默认行为，之前提到过的那个，会拦截我访问的任何路径，强制重定向到那里，这里按照GPT的提示创建一个配置文件，放在src/main/java/com/sast/sastreadtrack/config包下，内容为：  

```
package com.sast.sastreadtrack.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
public class SecurityConfig {

    // 配置访问权限和禁用默认登录页
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .csrf().disable()  // 关闭CSRF保护，前后端分离或者Postman测试可以关闭
                .authorizeRequests()
                .antMatchers("/api/user/login", "/api/user/register").permitAll() // 登录注册接口放行
                .anyRequest().authenticated() // 其他接口需要认证
                .and()
                .httpBasic().disable(); // 禁用默认Spring Security弹窗登录
        return http.build();
    }

    // 提供 BCrypt 密码加密器
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
```

能够关闭那个拦截页面，正常访问并测试，里面具体的一些代码功能没有深入理解，感觉暂时不用太深究配置文件的一些设置

测试发现，新创建的这个用户的密码存储已经变成哈希字符串了

![](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest/img/1759810695-image.png)

接下来引入JWT

![](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest/img/1759810791-image.png)

与session机制区分，JWT是服务端生成一个Token返回给前端，这个东西存储在前端，然后当前端每次发送请求，需要访问某些限制接口时，就携带这个Token，服务端只是验证。但session机制时存储在服务端的，前端仅仅携带一个ID，到服务端寻找

先引入三个依赖

```
<!-- JWT: JSON Web Token，用于鉴权 -->
<dependency>
    <groupId>io.jsonwebtoken</groupId>
    <artifactId>jjwt-api</artifactId>
    <version>0.11.5</version>
</dependency>
<dependency>
    <groupId>io.jsonwebtoken</groupId>
    <artifactId>jjwt-impl</artifactId>
    <version>0.11.5</version>
    <scope>runtime</scope>
</dependency>
<dependency>
    <groupId>io.jsonwebtoken</groupId>
    <artifactId>jjwt-jackson</artifactId>
    <version>0.11.5</version>
    <scope>runtime</scope>
</dependency>
```

新建一个src/main/java/com/sast/sastreadtrack/util/JwtUtil.java文件，内容如下：

```
package com.sast.sastreadtrack.util;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;

import java.security.Key;
import java.util.Date;

public class JwtUtil {

    // 建议使用安全随机生成的密钥，演示用简单字符串（长度至少 32）
    private static final String SECRET_KEY = "sastreadtrack-secret-key-2025-super-safe";

    // Token 有效时间（毫秒）——例如 1 天
    private static final long EXPIRATION_TIME = 24 * 60 * 60 * 1000;

    private static Key getSigningKey() {
        return Keys.hmacShaKeyFor(SECRET_KEY.getBytes());
    }

    /** 生成 JWT Token */
    public static String generateToken(Long userId, String username) {
        return Jwts.builder()
                .setSubject(username)
                .claim("userId", userId)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + EXPIRATION_TIME))
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    /** 验证 Token 是否有效 */
    public static boolean validateToken(String token) {
        try {
            Jwts.parserBuilder()
                    .setSigningKey(getSigningKey())
                    .build()
                    .parseClaimsJws(token);
            return true;
        } catch (JwtException e) {
            return false; // 过期、伪造等都属于无效
        }
    }

    /** 从 Token 中获取用户ID */
    public static Long getUserIdFromToken(String token) {
        Claims claims = Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
        return claims.get("userId", Long.class);
    }

    /** 从 Token 中获取用户名 */
    public static String getUsernameFromToken(String token) {
        Claims claims = Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
        return claims.getSubject();
    }
}

```

这里为了简单项目开发，让ai随便给了我一个密钥，且直接明文存储了，这段代码看起来操作有点多，其实实际上理解一下JWT发送的Token都表示什么，以及客户端和服务端之间是怎么用JWT鉴权的就可以理解代码了

JWT生成的Token一共有三段

```
header.payload.signature
```

每一段都是base64编码的字符串，其中各个部分内容表示如下

![](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest/img/1759832429-image.png)

前两段都是固定的明文，在Token传输过程中可以直接通过base64解码恢复。第三段signature是服务端根据前两段和存储的密钥进行签名算法生成的哈希值，再经base64产生的字符串，然后一并发送给客户端。客户端发送的Token，服务端再根据前两段和自己的密钥进行签名算法，将生成的哈希值与客户端传过来的signature进行比对，若一致则予以通过。

也就是说，JWT的安全性几乎完全来自于其密钥，若密钥泄露，安全性也就不复存在，如何保护密钥涉及到密码学和web安全相关范畴，这里就略过了

也就是说上面的java文件其实只是一个工具类，还没有实际运用于项目

在登录逻辑里面加一个生成JWT Token和返回Token就可以将Token传给前端，但要真正使其发挥作用则需要写一个过滤器

![](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest/img/1759833152-image.png)

在这里的作用就是当访问URL的时候拦截并验证Token，其实也是一段java代码而已

```
package com.sast.sastreadtrack.filter;

import com.sast.sastreadtrack.util.JwtUtil;
import io.jsonwebtoken.JwtException;
import org.springframework.stereotype.Component;

import javax.servlet.*;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;

@Component
public class JwtFilter implements Filter {

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {

        HttpServletRequest httpRequest = (HttpServletRequest) request;
        HttpServletResponse httpResponse = (HttpServletResponse) response;

        String authHeader = httpRequest.getHeader("Authorization");

        // 登录接口不拦截
        String path = httpRequest.getRequestURI();
        if (path.startsWith("/api/user/login")  path.startsWith("/api/user/register")) {
            chain.doFilter(request, response);
            return;
        }

        if (authHeader == null  !authHeader.startsWith("Bearer ")) {
            httpResponse.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            httpResponse.getWriter().write("缺少或无效的 Token");
            return;
        }

        String token = authHeader.substring(7);
        try {
            if (!JwtUtil.validateToken(token)) {
                httpResponse.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                httpResponse.getWriter().write("Token 无效或已过期");
                return;
            }
            // ✅ 验证通过，放行
            chain.doFilter(request, response);

        } catch (JwtException e) {
            httpResponse.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            httpResponse.getWriter().write("Token 校验失败");
        }
    }
}
```

![](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest/img/1759833440-image-1024x773.png)

然后我使用Token的时候出现了一点问题，传Token的话就报400错误码，不传就报401（这个正常）

问了一下AI，似乎和我前面用的session机制有些冲突，如果要用JWT鉴权的话，就得给前面用session机制的相关代码全部改为JWT

其实只需要修改两个Controller层方法就行，方法里面添加参数”@RequestHeader("Authorization") String authHeader“，获取UserId时使用”getUserIdFromToken(authHeader)“方法，相关方法为：

```
private Long getUserIdFromToken(String authHeader) {
        if (authHeader == null  !authHeader.startsWith("Bearer ")) {
            throw new RuntimeException("缺少或无效的 Token");
        }
        String token = authHeader.substring(7);
        return JwtUtil.getUserIdFromToken(token);
    }
```

其实就是从传入的Token里面获取一下UserId，也要使用JwtUtil工具类

现在再测试就一切正常，若不传Token则会出现：

![](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest/img/1759837877-image-1024x603.png)

传了Token就正常：

![](https://cdn.jsdelivr.net/gh/soapsama7/cdn_img@latest/img/1759837863-image-1024x782.png)

到这里就写的差不多了，后面问问ai传到github仓库就可以