# kuminson-cli

个人用脚手架工具

## Installation

```
$ npm install kuminson-cli -g
```

## Usage

### 1.打Tag号

Tag号格式为

```
<name>-<date>-v<version>
```

name 是package.json文件里的name

date 是当天的日期，YYYY-MM-DD格式

version 是package.json文件里的version，会进行三个级别的累加。

#### 命令

```
ll tag [-v | --version][-p | --push][(-r | -remote) <remoteName>][(-m | --message) <message>]
```

[-v | --version] 脚手架版本号

[-p | --push] 推送到远端服务器

[(-r | -remote) <remoteName>] 要推送远端服务器名，默认为origin

[(-m | --message) <message>] tag号的备注，默认名为'add Tag'

#### 例子

```
$ ll tag -p -m '初始化'
```

#### 备注

在package.json修改完commit后，虽然没有push到远端服务器，但把Tag号push到远端，checkout后依旧是最新的package.json，不用但心未修改问题。