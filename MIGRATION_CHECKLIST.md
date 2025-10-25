# ✅ Migration Checklist

Sử dụng checklist này để theo dõi quá trình migration.

## Phase 1: Preparation (HOÀN THÀNH ✅)

- [x] Cài đặt dependencies (`drizzle-orm`, `drizzle-kit`)
- [x] Tạo D1 database trên Cloudflare
- [x] Thiết kế database schema
- [x] Generate migration files
- [x] Apply migrations lên D1
- [x] Cấu hình wrangler.jsonc
- [x] Tạo migration utilities
- [x] Tạo migration runner
- [x] Update giới hạn xu lên 5 tỷ

## Phase 2: Data Migration (CẦN LÀM)

- [ ] Chạy migration runner: `bun run migrate:run`
- [ ] Mở http://127.0.0.1:8787/
- [ ] Click "Start Migration"
- [ ] Verify migration success trong logs
- [ ] Check số lượng users migrated
- [ ] So sánh sample data giữa KV và D1
- [ ] Test query performance

### Verification Commands:
```bash
# Đếm users
bunx wrangler d1 execute hanabi-db --remote --command="SELECT COUNT(*) as total FROM users"

# Xem top users
bunx wrangler d1 execute hanabi-db --remote --command="SELECT user_id, username, xu FROM users ORDER BY xu DESC LIMIT 10"

# Check specific user
bunx wrangler d1 execute hanabi-db --remote --command="SELECT * FROM users WHERE user_id='YOUR_ID'"
```

## Phase 3: Code Update (CẦN LÀM)

Cập nhật từng command file:

### Core Commands
- [ ] `src/commands/xu.ts` - Xem xu (có example)
- [ ] `src/commands/lucky.ts` - Lucky daily
- [ ] `src/commands/top.ts` - Leaderboard (QUAN TRỌNG)

### Game Commands  
- [ ] `src/commands/taixiu.ts` - Tài xỉu
- [ ] `src/commands/baucua.ts` - Bầu cua
- [ ] `src/commands/slot.ts` - Slot machine
- [ ] `src/commands/duangua.ts` - Đua gà

### Feature Commands
- [ ] `src/commands/nap.ts` - Nạp xu
- [ ] `src/commands/box.ts` - Mở hộp
- [ ] `src/commands/cauca.ts` - Câu cá
- [ ] `src/commands/gacha.ts` - Gacha
- [ ] `src/commands/banner.ts` - Banner info
- [ ] `src/commands/chuyenxu.ts` - Chuyển xu

### Other Commands
- [ ] `src/commands/help.ts` - Help menu (nếu dùng DB)

## Phase 4: Testing (CẦN LÀM)

### Local Testing
- [ ] Deploy local: `bun run dev`
- [ ] Test `/xu` command
- [ ] Test `/lucky` command  
- [ ] Test `/top` command (verify leaderboard)
- [ ] Test game commands (taixiu, baucua, etc.)
- [ ] Test transfer `/chuyenxu`
- [ ] Test gacha system
- [ ] Verify data persistence

### Production Testing
- [ ] Deploy to production: `bun run deploy`
- [ ] Monitor logs: `bunx wrangler tail`
- [ ] Test tất cả commands trên Discord
- [ ] Check error rates
- [ ] Monitor performance
- [ ] Verify data integrity

### Performance Testing
- [ ] Compare leaderboard query time (KV vs D1)
- [ ] Check response times
- [ ] Monitor database usage
- [ ] Check concurrent user handling

## Phase 5: Monitoring (CẦN LÀM)

- [ ] Monitor D1 metrics trong Cloudflare Dashboard
- [ ] Check error logs
- [ ] Watch for anomalies
- [ ] Collect user feedback
- [ ] Document any issues

## Phase 6: Cleanup (SAU KHI ỔN ĐỊNH)

⚠️ **CHỈ THỰC HIỆN SAU KHI:**
- Đã test kỹ tất cả features
- Production stable ít nhất 1 tuần
- Không có issues reported
- Backup dữ liệu đã complete

### Files to Remove
- [ ] `src/utils/database.ts` (KV version)
- [ ] `src/migrate-runner.ts`
- [ ] `src/utils/migrate.ts`
- [ ] `src/commands/xu.d1.ts` (example file)
- [ ] `MIGRATION.md`
- [ ] `MIGRATION_GUIDE.md`
- [ ] `MIGRATION_SUMMARY.md`
- [ ] `MIGRATION_CHECKLIST.md` (this file)

### Config Cleanup
- [ ] Remove KV binding từ `wrangler.jsonc`
- [ ] Update `src/types.ts` (remove GAME_DB)
- [ ] Final deployment
- [ ] Verify everything still works

### Optional
- [ ] Delete KV namespace (nếu không cần nữa)
- [ ] Archive migration scripts (backup)
- [ ] Update documentation

## 📊 Success Metrics

Track these metrics để verify migration success:

- [ ] 100% user data migrated
- [ ] 0% data loss
- [ ] <100ms leaderboard query time
- [ ] <50ms average command response
- [ ] 0 critical errors in 7 days
- [ ] User feedback positive

## 🆘 Rollback Plan

Nếu có vấn đề nghiêm trọng:

1. Revert code về KV version
2. Deploy version cũ
3. Investigate issues
4. Fix và retry migration

KV data vẫn còn nguyên, có thể rollback bất cứ lúc nào!

---

**Current Status:** Phase 1 Complete ✅  
**Next Step:** Phase 2 - Run Migration  
**Estimated Time:** 2-3 hours cho full migration + testing  
**Risk Level:** Low 🟢
