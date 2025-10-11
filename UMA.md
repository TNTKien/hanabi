# 🏇 Uma Musume Racing Game - Stats System

Each Uma has 5 stats, ranging from **400-1200 points** (randomized per race):

| Icon       | Name               | Range      | In-game Effect                                          |
| ---------- | ------------------ | ---------- | ------------------------------------------------------- |
| 🏃‍♀️      | **Speed**          | 400-1200   | Base movement speed per turn (1-4 steps)                |
| 💪         | **Stamina**        | 400-1200   | Endurance, decreases 30/turn. Low stamina → slows down |
| ⚡          | **Power**          | 400-1200   | 20% chance for burst acceleration +1 step               |
| 💃         | **Guts**           | 400-1200   | Final stretch boost (>70% track) +1 step                |
| 💡         | **Wisdom**         | 400-1200   | 10% chance to recover +50 stamina per turn              |

## 🎮 Game Mechanics

### Each Round:

1. **Base Speed** = 1-4 steps (based on Speed stat)
   - High Speed Uma → moves faster

2. **Power Boost** = +1 step (20% chance)
   - Probability depends on Power stat
   - Provides sudden acceleration

3. **Stamina Penalty**
   - Loses 30 stamina per turn
   - When stamina < 30% → -1 step (slows down)
   - Icons: 💪 (>50%), 😮 (20-50%), 💨 (<20%)

4. **Wisdom Recovery**
   - 10% chance to recover +50 stamina
   - Smart Uma → maintains energy better

5. **Guts Boost** (Final Sprint)
   - Activates after >70% of track
   - 30% chance for +1 step
   - High guts Uma → strong finish

## 💰 Multiplier System

```
High Total Stats → Easy Win → Low Multiplier (x2)
Low Total Stats → Hard Win → High Multiplier (x6)
```

**Formula:**
```typescript
avgStat = (Speed + Stamina + Power + Guts + Wisdom) / 5
multiplier = 8 - (avgStat / 200)
// Range: x2.0 - x6.0
```

## 📈 Stats Examples

### Strong Uma (Total: ~5500)
```
🏃‍♀️1100 💪1200 ⚡1050 💃1000 💡1150
→ Multiplier: x2.3 (easy win, low reward)
```

### Weak Uma (Total: ~2500)
```
🏃‍♀️450 💪520 ⚡480 💃550 💡500
→ Multiplier: x5.5 (hard win, high reward)
```

### Balanced Uma (Total: ~4000)
```
🏃‍♀️850 💪750 ⚡800 💃850 💡750
→ Multiplier: x4.0 (average)
```

## 🎯 Strategy Tips

1. **High Speed** → Consistent pace, good for short tracks
2. **High Stamina** → No late-race slowdown, good for long tracks
3. **High Power** → Many burst speeds, unpredictable
4. **High Guts** → Strong finish, can comeback
5. **High Wisdom** → Maintains stamina well, low risk

## 🏁 Race Ending

- First Uma to reach 40 steps = Winner
- If no winner after 25 rounds → Highest position wins
- Stamina indicator shown in real-time: 💪 😮 💨
- Hiển thị stamina realtime qua icon: 💪 😮 💨
