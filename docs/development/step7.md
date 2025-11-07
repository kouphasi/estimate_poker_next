## ステップ7: リアルタイム通信への移行

### 目標
ポーリングからWebSocketベースのリアルタイム通信に移行

### 技術選定

**オプション1**: Supabase Realtime
```typescript
const channel = supabase
  .channel('estimation-session')
  .on('postgres_changes',
    { event: '*', schema: 'public', table: 'Estimate' },
    (payload) => {
      // リアルタイム更新処理
    }
  )
  .subscribe()
```

**オプション2**: Socket.io
```typescript
// server
io.on('connection', (socket) => {
  socket.on('join-session', (sessionId) => {
    socket.join(sessionId)
  })

  socket.on('submit-estimate', (data) => {
    io.to(data.sessionId).emit('estimate-updated', data)
  })
})

// client
socket.emit('submit-estimate', { sessionId, value })
socket.on('estimate-updated', (data) => {
  // 更新処理
})
```

**オプション3**: Pusher
```typescript
const pusher = new Pusher(appKey, { cluster })
const channel = pusher.subscribe(`session-${sessionId}`)
channel.bind('estimate-updated', (data) => {
  // 更新処理
})
```

### 実装タスク（Step 7）

#### 7-1. 技術選定と設計（2時間）
- [ ] リアルタイム通信ライブラリの比較
- [ ] アーキテクチャ設計
- [ ] コスト試算

#### 7-2. セットアップ（3時間）
- [ ] ライブラリインストール
- [ ] 環境変数設定
- [ ] 接続確認

#### 7-3. サーバーサイド実装（4時間）
- [ ] WebSocketサーバー構築
- [ ] イベントハンドラ実装
- [ ] ルーム管理
- [ ] 切断処理

#### 7-4. クライアントサイド実装（4時間）
- [ ] WebSocket接続
- [ ] イベントリスナー
- [ ] リトライロジック
- [ ] フォールバック処理（ポーリング）

#### 7-5. 移行とテスト（3時間）
- [ ] 既存コードからの移行
- [ ] パフォーマンステスト
- [ ] 負荷テスト
- [ ] フォールバック動作確認

#### 7-6. 最適化（2時間）
- [ ] 接続プール管理
- [ ] メモリリーク対策
- [ ] エラーハンドリング強化

---
## 完了条件
### Step 7
- [ ] WebSocketで即座に更新される
- [ ] 接続が切れても自動再接続
- [ ] ポーリングからの移行が完了
- [ ] パフォーマンスが改善される
---

## 開発ログ
