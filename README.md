# 株式会社Canvas 公式サイト

HTML / CSS / JavaScript で作った静的サイトです。公開中：https://doriton02.github.io/canvas/

## しくみ

ヘッダー・フッター・色・住所などの共通部分は1か所にまとめてあり、`build.py` で各ページのHTMLを組み立てます。

| パス | 内容 |
| --- | --- |
| `site.config.json` | **サイト全体の設定**。サイト名、色、メニュー、フッター、住所・電話、SNS、問い合わせ帯の文言 |
| `src/pages/*.html` | **各ページの中身**。上に設定（タイトルなど）、`---` の下に本文 |
| `src/layout.html` | 全ページ共通の `<head>`・ヘッダー・フッター |
| `src/cta.html` | ページ下部の「Contact」帯（本文に `{{CTA}}` と書いた場所に入る） |
| `assets/css/style.css` | デザイン（全ページ共通） |
| `assets/js/main.js` | メニュー開閉、スクロール演出、「なぞって塗る」キャンバス、フォーム |
| `*.html`（ルート） | `build.py` が作る公開用ファイル。**直接編集しない** |
| `template/` | 別サイト用のひな形（後述） |

### 編集の流れ

1. `site.config.json` か `src/pages/〇〇.html` を編集する
2. `python3 build.py` を実行する（ルートの `*.html` が作り直される）
3. コミットして push する（1〜2分で公開サイトに反映）

CSS/JS を変更したときは、`site.config.json` の `asset_version` を1つ上げてください。スマホに古いファイルが残らなくなります。

### ページの書き方

```
title: 会社概要                ← ブラウザのタブに出る名前
desc: 検索結果に出る説明文
section: company               ← メニューで下線を付ける項目（nav の key）
hero_en: <em>Company</em>      ← ページ上部の大きな英字見出し
hero_jp: 会社概要
hero_accent: var(--blue)       ← 見出しの色（--blue / --red / --yellow / --green）
breadcrumb: Company            ← パンくず。階層は「Staff|staff.html > 須田 夏美」
---
<section class="section"> … 本文 … </section>

{{CTA}}
```

本文では `{{company.name}}`・`{{company.address}}`・`{{company.tel}}` のように書くと、`site.config.json` の値に置き換わります。

## 別サイトを作る（テンプレートの使い方）

`template/` は、このサイトと同じ構成・デザインで中身を空にしたひな形です（11ページ）。
見本：https://doriton02.github.io/canvas/template/

1. GitHubで新しいリポジトリを作る
2. `template/` の中身すべてと `build.py` を、新しいリポジトリの一番上にコピーする
3. `site.config.json` のサイト名・色・住所・メニューを書き換える
4. `src/pages/` の文章と、`assets/img/placeholder.svg` の画像を差し替える
5. `python3 build.py` を実行 → push → GitHub Pages を設定

このリポジトリの中でひな形を作り直すときは `python3 build.py template` を実行します（CSS/JS は本体の最新版がコピーされます）。

## 公開前に対応が必要なこと

- **お問い合わせフォーム**：今は「メールアプリを開く」方式です。フォームから直接送るには、Formspree などの送信サービスにつなぎ替えます。
- **ニュース記事**：一覧のリンク先は旧WordPressの記事です。旧サイトを閉じる前に記事の移行先を決めてください。
- **独自ドメイン**：`canonical` と OGP の URL は `site.config.json` の `base_url`（`https://canvasltd.com/`）を使っています。
