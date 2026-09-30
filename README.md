# 株式会社Canvas 公式サイト

HTML / CSS / JavaScript のみで作った静的サイトです（ビルド不要）。

## ファイル構成

| パス | 内容 |
| --- | --- |
| `index.html` | トップページ |
| `message.html` / `company.html` / `work.html` / `project.html` | 代表挨拶・会社概要・事業内容・Canvas Project |
| `staff.html`, `staff-*.html` | スタッフ一覧・個別インタビュー |
| `recruit.html`, `recruit-*.html` | 採用情報・各職種の募集要項 |
| `news.html` | お知らせ／Owner’s Voice 一覧 |
| `contact.html` | お問い合わせ・応募フォーム |
| `assets/css/style.css` | 全ページ共通のスタイル（色・フォントは冒頭の `:root` で変更可） |
| `assets/js/main.js` | メニュー開閉、スクロール演出、トップの「なぞって塗る」キャンバス、フォーム処理 |
| `assets/img/` | 画像 |

## ローカルで確認する

```sh
python3 -m http.server 8000
# → http://localhost:8000/
```

## 公開前に対応が必要なこと

- **お問い合わせフォーム**: 今はサーバー不要の「メールアプリを開く」方式です。フォームから直接送信したい場合は、Formspree や Google フォームなどの送信サービスにつなぎ替えてください。
- **ニュース記事**: 一覧のリンク先は、今の WordPress 上の記事（canvasltd.com）のままです。旧サイトを閉じる前に、記事の移行先を決めてください。
- **https**: 公開するサーバーで SSL（https）を有効にしてください。`canonical` と OGP の URL は `https://canvasltd.com/` を前提にしています。
