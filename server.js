// server.js
import { serveDir } from "jsr:@std/http/file-server";

// 直前の単語を保持しておく
let wordHistories = ["しりとり"];

// localhostにDenoのHTTPサーバーを展開
Deno.serve(async (_req) => {
    // パス名を取得する
    // http://localhost:8000/hoge に接続した場合"/hoge"が取得できる
    const pathname = new URL(_req.url).pathname;
    console.log(`pathname: ${pathname}`);

    // GET /shiritori: 直前の単語を返す
    if (_req.method === "GET" && pathname === "/shiritori") {
        return new Response(wordHistories[0]);
    }

    // POST /shiritori: 次の単語を受け取って保存する
    if (_req.method === "POST" && pathname === "/shiritori") {
        // リクエストのペイロードを取得
        const requestJson = await _req.json();
        // JSONの中からnextWordを取得
        const nextWord = requestJson["nextWord"];

        //これまでに使用されていたら
        if (wordHistories.includes(nextWord)) {
            return new Response(
                JSON.stringify({
                    "errorMessage": "これまでに使用されています",
                    "errorCode": "10003",
                }),
                {
                    status: 400,
                    headers: {
                        "Content-Type": "application/json; charset=utf-8",
                    },
                },
            );
        }
        //ひらがな以外があれば
        if (/\P{sc=Hira}/u.nextword) {
            return new Response(
                JSON.stringify({
                    "errorMessage": "ひらがな以外の文字が含まれています",
                    "errorCode": "10001",
                }),
                {
                    status: 400,
                    headers: {
                        "Content-Type": "application/json; charset=utf-8",
                    },
                },
            );
        }
        //末尾が「ん」だった場合
        if (nextWord.slice(-1) === "ん") {
            return new Response(
                JSON.stringify({
                    "errorMessage": "末尾が「ん」です",
                    "errorCode": "10002",
                }),
                {
                    status: 400,
                    headers: {
                        "Content-Type": "application/json; charset=utf-8",
                    },
                },
            );
        } // previousWordの末尾とnextWordの頭が同一か確認
        else if (wordHistories[0].slice(-1) === nextWord.slice(0, 1)) {
            // 同一であれば、previousWordを更新
            wordHistories.unshift(nextWord);
        } // 同一でない単語の入力時に、エラーを返す
        else {
            return new Response(
                JSON.stringify({
                    "errorMessage": "前の単語に続いていません",
                    "errorCode": "10001",
                }),
                {
                    status: 400,
                    headers: {
                        "Content-Type": "application/json; charset=utf-8",
                    },
                },
            );
        }

        // 現在の単語を返す
        return new Response(wordHistories[0]);
    }

    // POST /reset: リセットする
    if (_req.method === "POST" && pathname === "/RESET") {
        wordHistories.splice(0);
        wordHistories.unshift("しりとり");
        return new Response(wordHistories[0]);
    }

    // ./public以下のファイルを公開
    return serveDir(
        _req,
        {
            /*
            - fsRoot: 公開するフォルダを指定
            - urlRoot: フォルダを展開するURLを指定。今回はlocalhost:8000/に直に展開する
            - enableCors: CORSの設定を付加するか
            */
            fsRoot: "./public/",
            urlRoot: "",
            enableCors: true,
        },
    );
});
