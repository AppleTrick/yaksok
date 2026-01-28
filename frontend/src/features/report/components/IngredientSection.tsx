"use client";

import React from 'react';
import { ListChecks } from 'lucide-react';

interface Ingredient {
    name: string;
    amount: string;
    dailyPercent: number;
}

interface IngredientSectionProps {
    ingredients: Ingredient[];
}

export default function IngredientSection({ ingredients }: IngredientSectionProps) {
    return (
        <section className="report-section-wrap">
            <div className="section-title">
                <ListChecks size={20} className="icon" />
                <h2>인식된 성분</h2>
            </div>

            <div className="ingredient-grid-modern">
                {ingredients.map((ing, idx) => (
                    <div key={idx} className="ingredient-card-modern">
                        <div className="ing-header-modern">
                            <span className="ing-name-modern">{ing.name}</span>
                            <span className="ing-percent-modern">{ing.dailyPercent}%</span>
                        </div>
                        <div className="ing-progress-bg">
                            <div
                                className="ing-progress-fill"
                                style={{ width: `${Math.min(ing.dailyPercent, 100)}%` }}
                            />
                        </div>
                        <span className="ing-amount-modern">{ing.amount}</span>
                    </div>
                ))}
            </div>
        </section>
    );
}
