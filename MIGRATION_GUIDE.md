# 🚀 Hướng dẫn Migration từ KV sang D1

## ✅ Đã hoàn thành

1. ✅ Cài đặt Drizzle ORM và Drizzle Kit
2. ✅ Tạo schema D1 database
3. ✅ Generate và apply migrations lên D1
4. ✅ Cấu hình wrangler.jsonc với D1 binding
5. ✅ Tạo migration script và utilities

## 📋 Các bước tiếp theo

### Bước 1: Chạy Migration Data (QUAN TRỌNG!)

Migration runner đã sẵn sàng! Làm theo các bước sau:

```bash
# 1. Chạy migration runner
bun run migrate:run

# 2. Mở browser và truy cập:
# http://127.0.0.1:8787/

# 3. Click button "Start Migration" trên trang web

# 4. Đợi migration hoàn tất và xem kết quả
```

**Lưu ý:** 
- Migration sẽ copy TẤT CẢ dữ liệu từ KV sang D1
- Dữ liệu cũ trong KV vẫn được giữ nguyên (không bị xóa)
- Có thể chạy lại migration nhiều lần (sẽ overwrite dữ liệu trong D1)

### Bước 2: Kiểm tra Migration

Sau khi migration xong, kiểm tra dữ liệu:

```bash
# Kiểm tra số lượng users
bunx wrangler d1 execute hanabi-db --remote --command="SELECT COUNT(*) as total FROM users"

# Xem 10 users đầu tiên
bunx wrangler d1 execute hanabi-db --remote --command="SELECT user_id, username, xu FROM users LIMIT 10"

# Xem top 5 users có xu nhiều nhất
bunx wrangler d1 execute hanabi-db --remote --command="SELECT user_id, username, xu FROM users ORDER BY xu DESC LIMIT 5"
```

### Bước 3: Cập nhật Commands sử dụng D1

Bạn cần cập nhật TẤT CẢ commands để sử dụng D1 thay vì KV.

**Template thay đổi:**

```typescript
// ❌ CŨ (KV)
import { getUserData, saveUserData, updateLeaderboard } from "../utils/database";

export const exampleCommand = discordCommand({
  async execute(c) {
    const userId = c.interaction.member?.user.id!;
    const userData = await getUserData(userId, c.env.GAME_DB);
    
    // ... logic ...
    
    await saveUserData(userId, userData, c.env.GAME_DB);
    await updateLeaderboard(userId, username, userData.xu, c.env.GAME_DB);
  }
});

// ✅ MỚI (D1)
import { initDB, getUserData, saveUserData, updateLeaderboard } from "../db";

export const exampleCommand = discordCommand({
  async execute(c) {
    const db = initDB(c.env.DB);
    const userId = c.interaction.member?.user.id!;
    const userData = await getUserData(userId, db);
    
    // ... logic ...
    
    await saveUserData(userId, userData, db);
    await updateLeaderboard(userId, username, userData.xu, db);
  }
});
```

**Các files cần update:**
- ✅ `src/commands/xu.ts`
- ✅ `src/commands/lucky.ts`
- ✅ `src/commands/taixiu.ts`
- ✅ `src/commands/baucua.ts`
- ✅ `src/commands/slot.ts`
- ✅ `src/commands/duangua.ts`
- ✅ `src/commands/top.ts`
- ✅ `src/commands/nap.ts`
- ✅ `src/commands/box.ts`
- ✅ `src/commands/cauca.ts`
- ✅ `src/commands/gacha.ts`
- ✅ `src/commands/banner.ts`
- ✅ `src/commands/chuyenxu.ts`

### Bước 4: Test Commands

Sau khi update code:

```bash
# Deploy lên Cloudflare
bun run deploy

# Hoặc test local
bun run dev
```

Test các commands:
1. `/xu` - Xem số xu
2. `/lucky` - Nhận xu hàng ngày
3. `/taixiu` - Chơi tài xỉu
4. `/top` - Xem leaderboard (quan trọng - test query D1)

### Bước 5: Cleanup (SAU KHI ĐÃ TEST KỸ!)

**CẢNH BÁO:** Chỉ thực hiện bước này sau khi:
- ✅ Migration thành công
- ✅ Đã test tất cả commands
- ✅ Xác nhận dữ liệu đúng
- ✅ Worker chạy stable với D1

```bash
# 1. Xóa các files không cần thiết
rm src/utils/database.ts          # KV version cũ
rm src/migrate-runner.ts          # Migration runner
rm src/utils/migrate.ts           # Migration script
rm MIGRATION_GUIDE.md             # File này

# 2. Xóa KV binding trong wrangler.jsonc
# Mở wrangler.jsonc và xóa section "kv_namespaces"

# 3. Deploy version cuối cùng
bun run deploy
```

## 🎯 Kiến trúc mới

### Database Structure (D1 + Drizzle ORM)

```
src/db/
├── schema.ts       # Database schema definitions
└── index.ts        # Database utilities & queries

drizzle/            # Auto-generated migration files
└── 0000_*.sql      # SQL migrations
```

### API Comparison

| Function | KV (Old) | D1 (New) |
|----------|----------|----------|
| Init | `c.env.GAME_DB` | `initDB(c.env.DB)` |
| Get User | `getUserData(userId, kv)` | `getUserData(userId, db)` |
| Save User | `saveUserData(userId, data, kv)` | `saveUserData(userId, data, db)` |
| Leaderboard | `getTopUsers(kv, 10)` | `getTopUsers(db, 10)` |
| Update LB | `updateLeaderboard(...)` | `updateLeaderboard(...)` |

### Performance Benefits

- 🚀 **Query nhanh hơn**: SQL native vs KV list/scan
- 💾 **Storage hiệu quả**: Normalized data vs JSON blobs
- 🔍 **Indexed queries**: Leaderboard query ~10ms vs ~500ms
- 🛡️ **Type-safe**: Drizzle ORM với TypeScript
- 💰 **Chi phí thấp**: D1 free tier rất generous

## ❓ Troubleshooting

### Migration bị lỗi "No data"
```bash
# Kiểm tra KV có dữ liệu không
bunx wrangler kv:key list --binding=GAME_DB

# Re-run migration
bun run migrate:run
```

### Command báo lỗi "DB is not defined"
- Đảm bảo đã cập nhật `src/types.ts` với D1 binding
- Chạy `bunx wrangler types` để update types
- Restart dev server

### Dữ liệu không khớp
```bash
# So sánh data KV vs D1
# KV:
bunx wrangler kv:key get --binding=GAME_DB "user:YOUR_USER_ID"

# D1:
bunx wrangler d1 execute hanabi-db --remote --command="SELECT * FROM users WHERE user_id='YOUR_USER_ID'"
```

## 📞 Support

Nếu gặp vấn đề:
1. Check logs: `bunx wrangler tail`
2. Check D1 data: `bunx wrangler d1 execute hanabi-db --remote --command="..."`
3. Rollback nếu cần (giữ nguyên KV, không deploy D1 version)

---

**Chúc bạn migration thành công! 🎉**
