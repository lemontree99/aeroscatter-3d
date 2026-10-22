#!/bin/zsh
cd "${0:A:h}"
if ! command -v node >/dev/null 2>&1; then
  export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"
fi
if ! command -v node >/dev/null 2>&1; then
  echo "请先安装 Node.js 22 或更新版本，再双击此文件。"
  read -r "reply?按回车退出"
  exit 1
fi
node scripts/serve.mjs --open
