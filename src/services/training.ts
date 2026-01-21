"use client";

import { createClient } from "@/lib/supabase/client";

export interface TrainingData {
    id?: string;
    prompt: string;
    original_response: string;
    corrected_response: string;
    created_at?: string;
    user_id?: string;
}

/**
 * Save a piece of training data (user correction of AI response)
 */
export async function saveTrainingFeedback(data: TrainingData) {
    try {
        const supabase = createClient();
        const { data: userData } = await supabase.auth.getUser();

        const { error } = await supabase.from("ai_training_feedback").insert([
            {
                ...data,
                user_id: userData.user?.id || null,
                created_at: new Date().toISOString(),
            },
        ]);

        if (error) {
            console.warn("Failed to save training feedback to Supabase (check if table exists):", error);
            // Fallback to local storage for "Guest Mode" training data
            saveToLocalStorage(data);
            return false;
        }

        return true;
    } catch (err) {
        console.error("Error in saveTrainingFeedback:", err);
        saveToLocalStorage(data);
        return false;
    }
}

/**
 * Fallback to local storage for guest users or when table is missing
 */
function saveToLocalStorage(data: TrainingData) {
    try {
        const existing = JSON.parse(localStorage.getItem("nexus_training_data") || "[]");
        existing.push({
            ...data,
            created_at: new Date().toISOString(),
        });
        localStorage.setItem("nexus_training_data", JSON.stringify(existing));
        console.log("Training feedback saved to local storage.");
    } catch (err) {
        console.error("Critical failure in local training save:", err);
    }
}

/**
 * Export training data as JSON
 */
export function exportTrainingData() {
    const localData = localStorage.getItem("nexus_training_data") || "[]";
    const blob = new Blob([localData], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `nexus_ai_training_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
}
