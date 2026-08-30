"""Recette numérique indépendante du simulateur de couches minces.

Le script vérifie les conventions TMM, les cas élémentaires et la prescription
Fresnel contractuelle à 18 couches. Il ne fournit aucun corrigé de rendement.
"""

import sys

import numpy as np

sys.stdout.reconfigure(encoding="utf-8")


def interp_table(table, wavelength_nm):
    wavelengths = np.array([row[0] for row in table])
    indices = np.array([row[1] for row in table])
    extinctions = np.array([row[2] for row in table])
    n = np.interp(wavelength_nm, wavelengths, indices)
    k = np.interp(wavelength_nm, wavelengths, extinctions)
    return n - 1j * k


def bk7(wavelength_nm):
    wavelength_um_sq = (wavelength_nm / 1000.0) ** 2
    n_sq = (
        1.0
        + 1.03961212 * wavelength_um_sq / (wavelength_um_sq - 0.00600069867)
        + 0.231792344 * wavelength_um_sq / (wavelength_um_sq - 0.0200179144)
        + 1.01046945 * wavelength_um_sq / (wavelength_um_sq - 103.560653)
    )
    return complex(np.sqrt(n_sq), 0)


ZNS = [
    (350, 2.713, 0.2379), (400, 2.558, 0.0066), (450, 2.467, 0.0003),
    (500, 2.410, 0.0), (550, 2.372, 0.0), (600, 2.346, 0.0),
    (650, 2.326, 0.0), (700, 2.312, 0.0), (750, 2.301, 0.0),
    (800, 2.292, 0.0),
]
YF3 = [
    (350, 1.483, 0), (400, 1.477, 0), (450, 1.474, 0),
    (500, 1.471, 0), (550, 1.469, 0), (600, 1.468, 0),
    (650, 1.466, 0), (700, 1.466, 0), (750, 1.465, 0),
    (800, 1.464, 0),
]

MATERIAL = {
    "Air": lambda _wavelength: complex(1, 0),
    "BK7": bk7,
    "H": lambda wavelength: interp_table(ZNS, wavelength),
    "L": lambda wavelength: interp_table(YF3, wavelength),
    "AR": lambda _wavelength: complex(1.22474, 0),
}


def physical_thickness(material, multiplier, wavelength_0=550.0):
    return multiplier * wavelength_0 / (4.0 * MATERIAL[material](wavelength_0).real)


def physical_branch(value):
    root = np.sqrt(value)
    return np.conj(root) if root.imag > 0 else root


def tmm(wavelength_nm, theta_deg, stack, substrate="BK7", superstrate="Air", overrides=None):
    n_super = MATERIAL[superstrate](wavelength_nm)
    n_sub = MATERIAL[substrate](wavelength_nm)
    alpha = n_super.real * np.sin(np.radians(theta_deg))
    matrix_s = np.eye(2, dtype=complex)
    matrix_p = np.eye(2, dtype=complex)

    for index, (material, multiplier) in enumerate(stack):
        thickness_nm = overrides[index] if overrides is not None else physical_thickness(material, multiplier)
        index_layer = MATERIAL[material](wavelength_nm)
        gamma = physical_branch(index_layer * index_layer - alpha * alpha)
        phase = gamma * (2 * np.pi * thickness_nm / wavelength_nm)
        cosine, sine = np.cos(phase), np.sin(phase)
        for matrix, admittance in (
            (matrix_s, gamma),
            (matrix_p, index_layer * index_layer / gamma),
        ):
            layer_matrix = np.array(
                [[cosine, 1j * sine / admittance], [1j * admittance * sine, cosine]],
                dtype=complex,
            )
            matrix[:] = layer_matrix @ matrix

    gamma_super = physical_branch(n_super * n_super - alpha * alpha)
    gamma_sub = physical_branch(n_sub * n_sub - alpha * alpha)
    results = []
    for matrix, eta_0, eta_sub in (
        (matrix_s, gamma_super, gamma_sub),
        (matrix_p, n_super * n_super / gamma_super, n_sub * n_sub / gamma_sub),
    ):
        denominator = (
            eta_0 * matrix[0, 0]
            + eta_sub * matrix[1, 1]
            + eta_0 * eta_sub * matrix[0, 1]
            + matrix[1, 0]
        )
        reflection = (
            eta_0 * matrix[0, 0]
            + eta_0 * eta_sub * matrix[0, 1]
            - eta_sub * matrix[1, 1]
            - matrix[1, 0]
        ) / denominator
        transmission = 2 * eta_0 / denominator
        reflectance = abs(reflection) ** 2
        transmittance = (eta_sub.real / eta_0.real) * abs(transmission) ** 2
        results.append((reflectance, transmittance))

    (r_s, t_s), (r_p, t_p) = results
    return (r_s + r_p) / 2, (t_s + t_p) / 2


def parse_formula(formula):
    stack = []
    for token in formula.split():
        if token[-1] not in "HL":
            raise ValueError(f"Jeton inconnu : {token}")
        multiplier = int(token[:-1]) if token[:-1] else 1
        stack.append((token[-1], multiplier))
    return stack


def mean_transmission(stack, start_nm, stop_nm, step_nm=0.5, overrides=None):
    wavelengths = np.arange(start_nm, stop_nm + step_nm / 10, step_nm)
    return 100 * np.mean([tmm(wavelength, 0, stack, overrides=overrides)[1] for wavelength in wavelengths])


print("=" * 76)
print("A. CAS ÉLÉMENTAIRES")
print("=" * 76)
reflectance, transmittance = tmm(550, 0, [])
print(f"Air/BK7 à 550 nm : R = {100 * reflectance:.4f} %, T = {100 * transmittance:.4f} %")
assert abs(reflectance + transmittance - 1) < 1e-10
assert abs(100 * reflectance - 4.24) < 0.02

ar_stack = [("AR", 1)]
reflectance_ar, transmittance_ar = tmm(550, 0, ar_stack)
print(f"Monocouche AR QWOT : R = {100 * reflectance_ar:.5f} %, d = {physical_thickness('AR', 1):.3f} nm")
assert abs(reflectance_ar + transmittance_ar - 1) < 1e-10

for periods in (3, 4, 5, 6):
    bragg = parse_formula(("H L " * periods) + "H")
    reflectance_bragg, _ = tmm(550, 0, bragg)
    print(f"Bragg (HL)^{periods}H — {len(bragg):2d} couches : R(550) = {100 * reflectance_bragg:.3f} %")


print()
print("=" * 76)
print("B. PRESCRIPTION FRESNEL CONTRACTUELLE")
print("=" * 76)
FRESNEL_FORMULA = "H L 2H L H L H L 2H L H L H L 2H L H L"
fresnel = parse_formula(FRESNEL_FORMULA)
assert len(fresnel) == 18
assert fresnel[14:] == [("H", 2), ("L", 1), ("H", 1), ("L", 1)]
print(f"Formule : {FRESNEL_FORMULA}")
print("Nombre de couches : 18 ; variables BFGS contractuelles : 16, 17, 18")

t_reject_low = mean_transmission(fresnel, 460, 500)
t_pass = mean_transmission(fresnel, 535, 565)
t_reject_high = mean_transmission(fresnel, 620, 680)
q_rejection = 2 * t_pass / (t_reject_low + t_reject_high)
print(f"T̄(460–500) = {t_reject_low:.4f} %")
print(f"T̄(535–565) = {t_pass:.4f} %")
print(f"T̄(620–680) = {t_reject_high:.4f} %")
print(f"Qr = {q_rejection:.4f}")
assert np.isfinite(q_rejection) and q_rejection > 0

maximum_energy_error = 0.0
maximum_absorption = 0.0
for wavelength in np.arange(430, 700.1, 5):
    r_value, t_value = tmm(wavelength, 0, fresnel)
    absorption = 1 - r_value - t_value
    assert -1e-10 <= r_value <= 1 + 1e-10
    assert -1e-10 <= t_value <= 1 + 1e-10
    assert absorption >= -1e-10
    maximum_absorption = max(maximum_absorption, absorption)
    maximum_energy_error = max(maximum_energy_error, abs(r_value + t_value + absorption - 1))
print(f"Absorption maximale sur 430–700 nm : {100 * maximum_absorption:.4f} %")
print(f"Erreur maximale |R+T+A−1| : {maximum_energy_error:.3e}")
assert maximum_energy_error < 1e-9

print()
print("=" * 76)
print("C. SENSIBILITÉ AU PAS DE MESURE")
print("=" * 76)
for step in (0.1, 0.5, 2.0, 5.0):
    value = mean_transmission(fresnel, 535, 565, step)
    print(f"pas {step:>3.1f} nm : T̄pass = {value:.5f} %")

print("\nRECETTE NUMÉRIQUE : OK")
