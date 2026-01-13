"use server";

import { executeQuery } from "./db.js";
import jwt from "jsonwebtoken";


export async function loginUser(identifier, password) {
  try {
    const users = await executeQuery(
      `SELECT id, phone, password
       FROM users 
       WHERE phone = ?
       AND password = ?
       LIMIT 1`,
      [identifier, password]
    );

    if (users.length === 0) {
      return {
        success: false,
        message: "Invalid phone or password",
      };
    }

    // ✅ CREATE JWT
    const token = jwt.sign(
      {
        id: users[0].id,
        phone: users[0].phone,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return {
      success: true,
      message: "Login successful",
      token, // 👈 send token to client
      user: {
        id: users[0].id,
        phone: users[0].phone,
      },
    };
  } catch (error) {
    return {
      success: false,
      message: error.message,
    };
  }
}
export async function getGameHistory() {
  try {
    const rows = await executeQuery(
      `SELECT 
        id,
        round_start_time,
        a1,
        a2,
        b1,
        b2,
        c1,
        c2,
        created_at
      FROM \`game_history\`
      ORDER BY id DESC`
    );

    return rows;
  } catch (error) {
    console.error(error);
    return [];
  }
}
export async function insertHistory(data) {
  try {
    const result = await executeQuery(
      `
      INSERT INTO game_history (
        round_start_time,
        a1,
        a2,
        b1,
        b2,
        c1,
        c2
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      [
        data.round_start_time,
        data.a1,
        data.a2,
        data.b1,
        data.b2,
        data.c1,
        data.c2
      ]
    );

    return {
      success: true,
    };
  } catch (error) {
    console.error("Insert history error:", error);
    return {
      success: false,
      message: "Failed to insert game history",
    };
  }
}

// New functions for synchronized game timing
export async function saveGameRound(data) {
  try {
    const result = await executeQuery(
      `
      INSERT INTO game_rounds (
        round_number,
        round_start_time,
        round_end_time,
        a1_result,
        a2_result,
        b1_result,
        b2_result,
        c1_result,
        c2_result,
        status
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        data.roundNumber,
        data.roundStartTime,
        data.roundEndTime,
        data.a1,
        data.a2,
        data.b1,
        data.b2,
        data.c1,
        data.c2,
        data.status || 'completed'
      ]
    );

    return {
      success: true,
      roundId: result.insertId
    };
  } catch (error) {
    console.error("Save game round error:", error);
    return {
      success: false,
      message: "Failed to save game round",
    };
  }
}

export async function getCurrentGameRound() {
  try {
    const rows = await executeQuery(
      `SELECT *
      FROM game_rounds
      WHERE status = 'active'
      ORDER BY round_number DESC
      LIMIT 1`
    );

    return rows[0] || null;
  } catch (error) {
    console.error("Get current game round error:", error);
    return null;
  }
}

export async function updateGameRound(roundId, data) {
  try {
    await executeQuery(
      `
      UPDATE game_rounds
      SET
        a1_result = ?,
        a2_result = ?,
        b1_result = ?,
        b2_result = ?,
        c1_result = ?,
        c2_result = ?,
        status = ?
      WHERE id = ?
      `,
      [
        data.a1,
        data.a2,
        data.b1,
        data.b2,
        data.c1,
        data.c2,
        data.status || 'completed',
        roundId
      ]
    );

    return { success: true };
  } catch (error) {
    console.error("Update game round error:", error);
    return {
      success: false,
      message: "Failed to update game round"
    };
  }
}

export async function getGameRoundsByDate(date) {
  try {
    const rows = await executeQuery(
      `SELECT *
      FROM game_rounds
      WHERE DATE(round_start_time) = ?
      ORDER BY round_number DESC`,
      [date]
    );

    return rows;
  } catch (error) {
    console.error("Get game rounds by date error:", error);
    return [];
  }
}

// Image handling functions
export async function saveGameResultWithImage(data) {
  try {
    const result = await executeQuery(
      `
      INSERT INTO game_results (
        round_id,
        wheel_key,
        result_type,
        numeric_result,
        image_result,
        image_url,
        created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, NOW())
      `,
      [
        data.roundId,
        data.wheelKey,
        data.resultType || 'numeric',
        data.numericResult,
        data.imageResult,
        data.imageUrl
      ]
    );

    return {
      success: true,
      resultId: result.insertId
    };
  } catch (error) {
    console.error("Save game result with image error:", error);
    return {
      success: false,
      message: "Failed to save game result"
    };
  }
}

export async function getGameResultsByRound(roundId) {
  try {
    const rows = await executeQuery(
      `SELECT *
      FROM game_results
      WHERE round_id = ?
      ORDER BY wheel_key`,
      [roundId]
    );

    return rows;
  } catch (error) {
    console.error("Get game results by round error:", error);
    return [];
  }
}

export async function saveImageSelection(data) {
  try {
    const result = await executeQuery(
      `
      INSERT INTO user_selections (
        user_id,
        round_id,
        wheel_key,
        selection_type,
        numeric_selection,
        image_selection,
        image_url,
        created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
      `,
      [
        data.userId,
        data.roundId,
        data.wheelKey,
        data.selectionType || 'numeric',
        data.numericSelection,
        data.imageSelection,
        data.imageUrl
      ]
    );

    return {
      success: true,
      selectionId: result.insertId
    };
  } catch (error) {
    console.error("Save image selection error:", error);
    return {
      success: false,
      message: "Failed to save image selection"
    };
  }
}
