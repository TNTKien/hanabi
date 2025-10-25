# Migration từ KV sang D1

## Tổng quan

Dự án đang migrate từ Cloudflare KV sang D1 Database với Drizzle ORM để có hiệu suất và khả năng query tốt hơn.

## Cấu trúc Database mới (D1)

### Tables

1. **users** - Lưu thông tin user và xu
   - `user_id` (PRIMARY KEY) - Discord User ID
   - `username` - Tên người dùng
   - `xu` - Số xu hiện tại (default: 10000)
   - `last_lucky`, `last_box`, `last_fish` - Timestamps cho cooldowns
   - `buff_active`, `buff_multiplier` - Thông tin buff
   - `created_at`, `updated_at` - Timestamps

2. **fish_collection** - Lưu collection cá của user
   - `id` (PRIMARY KEY AUTO INCREMENT)
   - `user_id` (FOREIGN KEY → users.user_id)
   - `fish_type` - Loại cá
   - `count` - Số lượng

3. **gacha_collection** - Lưu collection nhân vật gacha
   - `id` (PRIMARY KEY AUTO INCREMENT)
   - `user_id` (FOREIGN KEY → users.user_id)
   - `game` - Tên game (ví dụ: "blue-archive")
   - `character_id` - ID nhân vật
   - `count` - Số lượng

4. **gacha_banners** - Lưu thông tin banner gacha
   - `id` (PRIMARY KEY AUTO INCREMENT)
   - `game` - Tên game
   - `character_id` - ID nhân vật
   - `start_time`, `end_time` - Thời gian banner

## Các bước Migration

### 1. Setup đã hoàn thành ✅

- [x] Cài đặt `drizzle-orm` và `drizzle-kit`
- [x] Tạo schema trong `src/db/schema.ts`
- [x] Generate migration files
- [x] Apply migration lên D1 database
- [x] Cấu hình wrangler.jsonc với D1 binding

### 2. Chạy Migration Data

Có 2 cách để migrate dữ liệu:

#### Cách 1: Sử dụng Migration Runner (Khuyến nghị)

```bash
# Chạy migration runner ở local
bunx wrangler dev src/migrate-runner.ts

# Mở browser và truy cập
# http://localhost:8787/
# Click button "Start Migration"
```

#### Cách 2: Deploy và chạy migration

```bash
# Deploy worker với cả KV và D1 bindings
bun run deploy

# Sau đó tạo một script riêng để trigger migration
# hoặc sử dụng wrangler để chạy một lần
```

### 3. Cập nhật Code để sử dụng D1

Sau khi migration xong, cần cập nhật các commands để sử dụng D1 thay vì KV:

**Thay thế:**
```typescript
// Cũ (KV)
import { getUserData, saveUserData } from "./utils/database";
const userData = await getUserData(userId, c.env.GAME_DB);
await saveUserData(userId, userData, c.env.GAME_DB);

// Mới (D1)
import { initDB, getUserData, saveUserData } from "./db";
const db = initDB(c.env.DB);
const userData = await getUserData(userId, db);
await saveUserData(userId, userData, db);
```

### 4. Kiểm tra và Xác nhận

Sau khi migration:

1. Kiểm tra dữ liệu trong D1:
```bash
bunx wrangler d1 execute hanabi-db --command="SELECT COUNT(*) FROM users"
bunx wrangler d1 execute hanabi-db --command="SELECT * FROM users LIMIT 10"
```

2. Test các commands với D1
3. So sánh dữ liệu giữa KV và D1

### 5. Cleanup

Sau khi xác nhận migration thành công:

1. Xóa file cũ:
   - `src/utils/database.ts` (KV version)
   - `src/migrate-runner.ts` (không cần nữa)
   - `src/utils/migrate.ts` (không cần nữa)

2. Xóa KV binding trong `wrangler.jsonc`

3. Update imports trong tất cả commands

## Lợi ích của D1

- ✅ **Query mạnh mẽ hơn**: SQL queries với joins, aggregations, etc.
- ✅ **Hiệu suất tốt hơn**: Index support, faster reads
- ✅ **Type-safe**: Drizzle ORM với TypeScript
- ✅ **Leaderboard hiệu quả**: ORDER BY và LIMIT native
- ✅ **Relations**: Foreign keys và data integrity
- ✅ **Cost-effective**: Free tier 5GB storage, 5M reads/day

## Troubleshooting

### Migration bị lỗi
- Kiểm tra logs: `bunx wrangler tail`
- Xem migration history: `bunx wrangler d1 migrations list hanabi-db`

### Dữ liệu không đúng
- Chạy lại migration sau khi xóa dữ liệu:
```bash
bunx wrangler d1 execute hanabi-db --command="DELETE FROM users"
# Rồi chạy lại migration
```

### Schema changes
```bash
# Update schema.ts
# Generate new migration
bun drizzle-kit generate

# Apply migration
bunx wrangler d1 migrations apply hanabi-db --remote
```

## Notes

- KV binding (`GAME_DB`) sẽ được giữ tạm trong quá trình migration
- D1 binding là `DB` (khác với `GAME_DB`)
- Tất cả xu sẽ được cap ở `MAX_XU_AMOUNT` (5 tỷ) khi save
- Migration script tự động handle timestamps và data normalization
