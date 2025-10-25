# 🔄 Migration Guide for Existing Bot Instances

## Tình huống

Bạn đã clone repo này từ trước và đang chạy bot với **KV storage**. Giờ repo đã migrate sang **D1 database**. Đây là hướng dẫn để migrate dữ liệu của bạn.

## ⚠️ Quan trọng

- Migration này sẽ copy data từ KV sang D1
- KV data của bạn **không bị xóa** (an toàn)
- Có thể rollback nếu có vấn đề
- **Backup data trước khi migrate!**

## 📋 Các bước Migration

### Bước 1: Pull code mới

```bash
git fetch origin
git checkout d1
git pull origin d1
```

### Bước 2: Cài dependencies mới

```bash
bun install
```

### Bước 3: Tạo D1 Database

```bash
# Tạo D1 database
bunx wrangler d1 create hanabi-db

# Copy database_id từ output vào wrangler.jsonc
# Thay thế ID trong section d1_databases
```

### Bước 4: Apply Database Migrations

```bash
# Generate migrations (đã có sẵn trong drizzle/)
bun run db:generate

# Apply migrations lên D1
bun run db:migrate
```

### Bước 5: Update wrangler.jsonc

Mở `wrangler.jsonc` và cập nhật `database_id` trong section `d1_databases`:

```jsonc
"d1_databases": [
  {
    "binding": "DB",
    "database_name": "hanabi-db",
    "database_id": "YOUR_DATABASE_ID_HERE", // ← Thay bằng ID từ bước 3
    "migrations_dir": "drizzle"
  }
]
```

### Bước 6: Chạy Migration Data

**Option A: Deploy Migration Runner (Khuyến nghị)**

```bash
# Deploy migration runner
bunx wrangler deploy src/migrate-runner.ts --config wrangler.migrate.jsonc --name hanabi-migrate

# Chạy migration (thay YOUR_WORKER_URL bằng URL từ output)
curl https://hanabi-migrate.YOUR_ACCOUNT.workers.dev/migrate

# Verify migration
curl https://hanabi-migrate.YOUR_ACCOUNT.workers.dev/verify
```

**Option B: Local Migration (Nếu có ít data)**

```bash
# Populate test data vào remote KV nếu chưa có
bun run populate-kv

# Sau đó dùng Option A để migrate
```

### Bước 7: Verify Migration

```bash
# Check số users đã migrate
bunx wrangler d1 execute hanabi-db --remote --file scripts/verify-migration.sql

# Hoặc dùng verify endpoint
curl https://hanabi-migrate.YOUR_ACCOUNT.workers.dev/verify
```

### Bước 8: Deploy Bot với D1

```bash
# Deploy bot mới sử dụng D1
bun run deploy
```

### Bước 9: Test Bot

Test các commands trong Discord:
- `/xu` - Check user balance
- `/top` - Check leaderboard (test D1 queries)
- `/lucky` - Test data persistence
- Game commands - Verify xu updates work

### Bước 10: Cleanup (Sau khi stable)

**Chỉ làm sau khi confirm bot chạy ổn định ít nhất 1 tuần!**

```bash
# Xóa KV binding trong wrangler.jsonc
# (Xóa section "kv_namespaces")

# Xóa migration runner worker
bunx wrangler delete hanabi-migrate

# Deploy final version
bun run deploy
```

## 🔧 Troubleshooting

### Migration báo "Found 0 users"

**Nguyên nhân:** KV namespace trống hoặc dùng sai namespace ID

**Giải pháp:**
```bash
# Check KV data
bunx wrangler kv key list --namespace-id=YOUR_KV_ID

# Nếu trống, data của bạn ở namespace khác
bunx wrangler kv namespace list

# Tìm namespace đúng và update trong wrangler.jsonc
```

### Migration bị lỗi "Too many API requests"

**Nguyên nhân:** Quá nhiều fish/gacha collection data

**Giải pháp:** Migration script đã được optimize để skip fish/gacha data (sẽ generate lại khi người chơi sử dụng). Chỉ migrate user data và xu.

### Bot báo lỗi "DB is not defined"

**Nguyên nhân:** Chưa update types

**Giải pháp:**
```bash
bunx wrangler types
```

### Data không khớp giữa KV và D1

**Giải pháp:**
```bash
# Check KV data
bunx wrangler kv key get --namespace-id=YOUR_KV_ID "user:YOUR_USER_ID"

# Check D1 data  
curl https://hanabi-migrate.YOUR_ACCOUNT.workers.dev/verify

# Chạy lại migration (safe, sẽ overwrite)
curl https://hanabi-migrate.YOUR_ACCOUNT.workers.dev/migrate
```

## 🔄 Rollback Plan

Nếu có vấn đề nghiêm trọng:

1. **Revert code về version KV:**
   ```bash
   git checkout master  # hoặc commit trước khi merge d1
   ```

2. **Deploy version cũ:**
   ```bash
   bun run deploy
   ```

3. **KV data vẫn còn nguyên**, bot sẽ hoạt động như trước!

## 📊 So sánh KV vs D1

| Feature | KV (Cũ) | D1 (Mới) |
|---------|---------|----------|
| Query speed | Slow (~500ms leaderboard) | Fast (~10ms) |
| Xu limit | 1 tỷ | 5 tỷ |
| Cost | $0.50/1M reads | Free (5M reads/day) |
| Type safety | JSON parsing | Drizzle ORM |
| Scalability | Limited | Better |

## 🎯 Checklist

- [ ] Pull code mới (branch `d1`)
- [ ] Cài dependencies
- [ ] Tạo D1 database
- [ ] Update `wrangler.jsonc` với database ID
- [ ] Apply migrations
- [ ] Deploy migration runner
- [ ] Chạy migration
- [ ] Verify migration thành công
- [ ] Deploy bot mới
- [ ] Test bot trong Discord
- [ ] Monitor logs trong 1 tuần
- [ ] Cleanup (xóa KV binding & migration runner)

## 💡 Tips

1. **Backup trước:** Export KV data nếu lo lắng
   ```bash
   bunx wrangler kv key list --namespace-id=YOUR_KV_ID > kv-backup.json
   ```

2. **Test local trước:** Deploy lên dev environment trước khi production

3. **Monitor logs:** 
   ```bash
   bunx wrangler tail
   ```

4. **Có thể chạy migration nhiều lần** - Safe to re-run!

## 📞 Support

Nếu gặp vấn đề:
- Check logs: `bunx wrangler tail`
- Check D1 data: Dùng `/verify` endpoint
- Open issue trên GitHub

---

**Chúc bạn migration thành công! 🎉**
