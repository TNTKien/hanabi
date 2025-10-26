/**
 * Validation utilities for game safety and number overflow prevention
 */

import type { UserData } from "../types";

// JavaScript's MAX_SAFE_INTEGER = 9,007,199,254,740,991
export const MAX_SAFE_INTEGER = Number.MAX_SAFE_INTEGER;

// Giới hạn cược tối đa: 100 triệu xu (để tránh overflow khi nhân với multiplier lớn)
export const MAX_BET_AMOUNT = 100_000_000;

// Giới hạn xu tối đa trong tài khoản: 5 tỷ xu (để tránh số quá lớn)
export const MAX_XU_AMOUNT = 5_000_000_000;

// Cược tối thiểu mặc định
export const MIN_BET_AMOUNT = 1;

/**
 * Kiểm tra xem một số có nằm trong giới hạn an toàn của JavaScript không
 */
export function isSafeNumber(num: number): boolean {
  return Number.isSafeInteger(num) && num <= MAX_SAFE_INTEGER && num >= -MAX_SAFE_INTEGER;
}

/**
 * Cộng hai số một cách an toàn, trả về null nếu overflow
 * Hỗ trợ cả số nguyên và số thập phân
 */
export function safeAdd(a: number, b: number): number | null {
  const result = a + b;
  // Check if result is finite and not too large
  // Allow decimal numbers, just check if they're within safe range
  if (!Number.isFinite(result) || Math.abs(result) > MAX_SAFE_INTEGER) {
    return null;
  }
  return result;
}

/**
 * Nhân hai số một cách an toàn, trả về null nếu overflow
 * Hỗ trợ cả số nguyên và số thập phân (ví dụ: multiplier 0.5, 1.5, 2.7)
 */
export function safeMultiply(a: number, b: number): number | null {
  const result = a * b;
  // Check if result is finite and not too large
  // Allow decimal numbers, just check if they're within safe range
  if (!Number.isFinite(result) || Math.abs(result) > MAX_SAFE_INTEGER) {
    return null;
  }
  return result;
}

/**
 * Kiểm tra số xu có vượt quá giới hạn không
 */
export function isXuOverLimit(xu: number): boolean {
  return xu > MAX_XU_AMOUNT;
}

/**
 * Giới hạn số xu trong phạm vi cho phép
 */
export function capXu(xu: number): number {
  if (xu > MAX_XU_AMOUNT) {
    return MAX_XU_AMOUNT;
  }
  if (xu < 0) {
    return 0;
  }
  return Math.floor(xu);
}

/**
 * Validate số tiền cược
 */
export function validateBetAmount(
  betAmount: number,
  userXu: number,
  minBet: number = MIN_BET_AMOUNT
): {
  valid: boolean;
  error?: string;
} {
  if (isNaN(betAmount) || !Number.isInteger(betAmount)) {
    return {
      valid: false,
      error: "❌ Số xu cược không hợp lệ!",
    };
  }

  if (betAmount < minBet) {
    return {
      valid: false,
      error: `❌ Số xu cược tối thiểu là **${minBet.toLocaleString()} xu**!`,
    };
  }

  if (betAmount > MAX_BET_AMOUNT) {
    return {
      valid: false,
      error: `❌ Số xu cược tối đa là **${MAX_BET_AMOUNT.toLocaleString()} xu**!`,
    };
  }

  if (betAmount > userXu) {
    return {
      valid: false,
      error: `❌ Bạn không đủ xu! (Có: **${userXu.toLocaleString()} xu**)`,
    };
  }

  return { valid: true };
}

/**
 * Tính toán tiền thắng một cách an toàn
 * Hỗ trợ multiplier thập phân (0.5, 0.9, 1.5, v.v.)
 * Kết quả luôn được làm tròn xuống thành số nguyên
 */
export function calculateWinAmount(
  betAmount: number,
  multiplier: number
): {
  success: boolean;
  amount?: number;
  error?: string;
} {
  const result = safeMultiply(betAmount, multiplier);

  if (result === null) {
    return {
      success: false,
      error: "❌ Số xu thắng vượt quá giới hạn! Vui lòng giảm số xu cược.",
    };
  }

  // Luôn trả về số nguyên (làm tròn xuống)
  return {
    success: true,
    amount: Math.floor(result),
  };
}

/**
 * Cập nhật xu người dùng một cách an toàn
 */
export function updateUserXu(
  currentXu: number,
  change: number
): {
  success: boolean;
  newXu?: number;
  error?: string;
} {
  const result = safeAdd(currentXu, change);

  if (result === null) {
    return {
      success: false,
      error: "❌ Số xu vượt quá giới hạn!",
    };
  }

  if (result < 0) {
    return {
      success: false,
      error: "❌ Số xu không đủ!",
    };
  }

  // Cap xu at maximum
  const cappedXu = capXu(result);

  return {
    success: true,
    newXu: cappedXu,
  };
}

/**
 * Cập nhật xu khi thua - trừ theo tỷ lệ, không bao giờ xuống âm
 * Nếu không đủ xu để trừ đủ, trừ hết số xu còn lại và về 0
 */
export function updateUserXuOnLoss(
  currentXu: number,
  betAmount: number
): {
  success: boolean;
  newXu: number;
  actualLoss: number; // Số xu thực sự bị mất
} {
  // Nếu đủ xu, trừ đầy đủ
  if (currentXu >= betAmount) {
    const result = safeAdd(currentXu, -betAmount);
    
    if (result === null) {
      // Nếu có lỗi tính toán, trả về xu hiện tại
      return {
        success: true,
        newXu: currentXu,
        actualLoss: 0,
      };
    }
    
    return {
      success: true,
      newXu: Math.max(0, result),
      actualLoss: betAmount,
    };
  }
  
  // Nếu không đủ xu, trừ hết số xu còn lại và về 0
  const actualLoss = currentXu;
  
  return {
    success: true,
    newXu: 0,
    actualLoss: actualLoss,
  };
}

/**
 * Apply and consume buff if active
 * Returns the final multiplier and buff text to display
 * Modifies userData to consume the buff
 */
export function applyAndConsumeBuff(
  userData: UserData,
  baseMultiplier: number
): {
  finalMultiplier: number;
  buffText: string;
} {
  let finalMultiplier = baseMultiplier;
  let buffText = "";
  
  if (userData.buffActive && userData.buffMultiplier) {
    finalMultiplier = baseMultiplier * userData.buffMultiplier;
    buffText = ` 🔥x${userData.buffMultiplier} buff!`;
    // Consume buff after use
    userData.buffActive = false;
    userData.buffMultiplier = undefined;
  }
  
  return { finalMultiplier, buffText };
}
