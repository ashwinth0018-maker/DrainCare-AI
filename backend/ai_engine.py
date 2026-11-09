
def analyze_drainage_risk(water_level, temperature, gas_level):

    score = 0
    reasons = []

    # Water level analysis
    if water_level >= 80:
        score += 40
        reasons.append("Water level is critically high")
    elif water_level >= 60:
        score += 25
        reasons.append("Water level is elevated")

    # Temperature analysis
    if temperature >= 50:
        score += 30
        reasons.append("Temperature is critically high")
    elif temperature >= 35:
        score += 15
        reasons.append("Temperature is elevated")

    # Gas level analysis
    if gas_level >= 700:
        score += 30
        reasons.append("Gas reading is critically high")
    elif gas_level >= 400:
        score += 15
        reasons.append("Gas reading is elevated")

    # Maximum risk score
    score = min(score, 100)

    # Determine risk level
    if score >= 50:
        risk_level = "High"
        recommendation = "Immediate inspection required"
    elif score >= 25:
        risk_level = "Medium"
        recommendation = "Schedule a drainage inspection"
    else:
        risk_level = "Low"
        recommendation = "Continue regular monitoring"

    # Default reason
    if not reasons:
        reasons.append("All readings are within demo thresholds")

    # Return analysis result
    return {
        "risk_score": score,
        "risk_level": risk_level,
        "reasons": reasons,
        "recommendation": recommendation
    }

