# kuminson-cli

个人用脚手架工具

## Installation

```
$ npm install kuminson-cli -g
```

## Usage

### 1.打Tag号

Tag号格式为<name>-<date>-v<version>

name 是package.json文件里的name

date 是当天的日期，YYYY-MM-DD格式

version 是package.json文件里的version，会进行三个级别的累加。

#### 命令

```
ll tag [-p | --push][(-r | -remote) <remoteName>]
```

[-p | --push] 推送到远端服务器

[(-r | -remote) <remoteName>] 要推送远端服务器名，默认为origin

#### 例子

```
$ ll tag -p
```