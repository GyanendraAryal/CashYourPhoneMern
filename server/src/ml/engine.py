import math
from typing import List

# CONDITION_DEPRECIATION: Multipliers based on device condition
# This can be evolved into a real regression model trained on historical data.
CONDITION_DEPRECIATION = {
    "new": 1.0,
    "like_new": 0.88,
    "refurbished": 0.75,
    "pre_owned": 0.65,
}

def estimate_value(base_price: float, condition: str) -> int:
    """
    Estimates device value using a weighted depreciation model.
    """
    cond = condition.lower().strip().replace(" ", "_")
    weight = CONDITION_DEPRECIATION.get(cond, 0.6)
    
    # Base estimated value
    val = base_price * weight
    
    # Apply a standard 5% business margin
    final_val = math.floor(val * 0.95)
    
    return max(0, final_val)


