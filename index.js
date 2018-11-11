#!/usr/bin/env node

const path = require('path');
const fs = require('fs');
const argv = require('minimist')(process.argv.slice(2));
const request = require('request');
const glob = require('glob');
const { version } = require('./package.json');
const { getReadableSize, isImageExt } = require('./utils');

const CONFIG_PATH = path.resolve(process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE, '.tinypng');

function tips() {
  console.log('请前往 https://tinypng.com/developers 获取api秘钥后，运行 tinpng --key=你的秘钥 设置');
};

function help() {
  console.log(`
Usage
    tinypng <path>
    Example
      tinypng resource/images
      tinypng resource/images/logo.png
    Options
      -k --key
      -v --version
      -r --recursive
  `);
};


function main() {
  if (argv.v || argv.version) {
    console.log(version);
    return;
  }

  if (argv.h || argv.help) {
    help();
    return;
  }
    
  if (argv.key) {
    fs.writeFileSync(CONFIG_PATH, argv.key, 'utf-8');
    return;
  }
    
  if (!fs.existsSync(CONFIG_PATH)) {
    return tips();
  }
    
  const config = {};
  config.key = fs.readFileSync(CONFIG_PATH, 'utf-8');
 
  if (!config.key) {
    return tips();
  }

  const targetDir = argv._.length ? argv._ : ['.'];
  let images = [];
  targetDir.forEach(dir => {
    if (fs.existsSync(dir)) {
      if (fs.lstatSync(dir).isDirectory()) {
        const currentDirImages = glob.sync(dir + (argv.r || argv.recursive ? '/**' : '') + '/*.+(png|jpg|jpeg|PNG|JPG|JPEG)');
        images = images.concat(currentDirImages);
      } else if (isImageExt(dir.trim())) {
        images.push(dir);
      }
    }
  });

  if (!images.length) {
    console.error('没有图片可以上传');
    return;
  }

  images.forEach(image => {
    console.log(`上传 ${image} 中...`)
    fs.createReadStream(image).pipe(request.post('https://api.tinify.com/shrink', {
      auth: {
        'user': 'api',
        'pass': config.key
      }
    }, (error, response, body) => {
      if (error) {
        console.error(error);
        return;
      }
      try {
        body = JSON.parse(body);
      } catch (e) {
        console.log(e);
        return;
      }

      if (response.statusCode === 201) {
        const { input: { size: inputSize } = {}, output: { url, size: outputSize } = {} } = body;
        console.log(`压缩前：${getReadableSize(inputSize)}`);
        console.log(`压缩后：${getReadableSize(outputSize)}`);
        console.log(`减少了约${Math.round((inputSize - outputSize) / inputSize * 100) }% 的体积`);
        request.get(url).pipe(fs.createWriteStream(image));
      } else {
        console.error(body.error);
      }
    }))
  })
}


main();