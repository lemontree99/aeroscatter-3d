"""Print independent reference JSON; requires numpy and miepython (2.x or 3.x).

Never updates the checked-in fixture automatically. Review differences first.
"""
import json
import numpy as np
import miepython

amplitudes = getattr(miepython, "S1_S2", None) or miepython.mie_S1_S2
efficiencies = getattr(miepython, "efficiencies_mx", None) or miepython.mie
cases = []
for m in [1.01, 1.5, 2.0]:
    for x in [0.05, 0.2, 2.0, 8.0, 16.0]:
        angles = [0, 30, 60, 90, 120, 150, 180]
        s1, s2 = amplitudes(m, x, np.cos(np.radians(angles)), norm="wiscombe")
        _, qsca, _, _ = efficiencies(m, x)
        cases.append({"m": m, "x": x, "qsca": float(qsca), "angular": [
            {"theta": theta, "perpendicular": float(abs(a) ** 2), "parallel": float(abs(b) ** 2)}
            for theta, a, b in zip(angles, s1, s2)
        ]})
print(json.dumps({"reference": "miepython", "version": miepython.__version__, "normalization": "wiscombe", "cases": cases}, indent=2))
