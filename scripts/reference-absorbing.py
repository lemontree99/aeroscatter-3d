"""Independent absorbing-sphere references; stdout only, no fixture overwrite.

UI uses n+i*kappa. miepython uses n-i*kappa. Intensities and efficiencies
are invariant under this convention change; complex amplitudes need conjugation.
"""
import json
import numpy as np
import miepython

amplitudes = getattr(miepython, "S1_S2", None) or miepython.mie_S1_S2
efficiencies = getattr(miepython, "efficiencies_mx", None) or miepython.mie
cases = []
for n in [1.01, 1.5, 2.0]:
    for kappa in [0.001, 0.1, 1.0]:
        for x in [0.05, 0.2, 2.0, 8.0, 16.0]:
            m = complex(n, -kappa)
            angles = [0, 30, 60, 90, 120, 150, 180]
            s1, s2 = amplitudes(m, x, np.cos(np.radians(angles)), norm="wiscombe")
            qext, qsca, _, _ = efficiencies(m, x)
            cases.append({"n": n, "kappa": kappa, "x": x,
                          "qext": float(qext), "qsca": float(qsca), "qabs": float(qext-qsca),
                          "angular": [{"theta": theta, "perpendicular": float(abs(a)**2), "parallel": float(abs(b)**2)}
                                      for theta, a, b in zip(angles, s1, s2)]})
print(json.dumps({"reference": "miepython", "version": miepython.__version__, "normalization": "wiscombe",
                  "ui_convention": "m=n+i*kappa", "reference_convention": "m=n-i*kappa", "cases": cases}, indent=2))
