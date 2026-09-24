/* @ds-bundle: {"format":3,"namespace":"HyperaPharmaDesignSystem_e2c335","components":[{"name":"Button","sourcePath":"components/buttons/Button.jsx"},{"name":"IconButton","sourcePath":"components/buttons/IconButton.jsx"},{"name":"Badge","sourcePath":"components/data-display/Badge.jsx"},{"name":"Card","sourcePath":"components/data-display/Card.jsx"},{"name":"Tag","sourcePath":"components/data-display/Tag.jsx"},{"name":"Checkbox","sourcePath":"components/forms/Checkbox.jsx"},{"name":"Input","sourcePath":"components/forms/Input.jsx"},{"name":"Select","sourcePath":"components/forms/Select.jsx"},{"name":"Switch","sourcePath":"components/forms/Switch.jsx"},{"name":"Footer","sourcePath":"components/layout/Footer.jsx"},{"name":"Link","sourcePath":"components/navigation/Link.jsx"},{"name":"Navbar","sourcePath":"components/navigation/Navbar.jsx"}],"sourceHashes":{"components/buttons/Button.jsx":"ea0e7334dd6f","components/buttons/IconButton.jsx":"9a04ce118a70","components/data-display/Badge.jsx":"75534687409f","components/data-display/Card.jsx":"1aebb5ca666b","components/data-display/Tag.jsx":"53685203e19d","components/forms/Checkbox.jsx":"57f309628347","components/forms/Input.jsx":"c22f449bc3fc","components/forms/Select.jsx":"a85e689ffb51","components/forms/Switch.jsx":"ade8e65d6030","components/layout/Footer.jsx":"8c851b9d432b","components/navigation/Link.jsx":"50c162188e34","components/navigation/Navbar.jsx":"1c1602be137d","ui_kits/hypera-site/BrandStrip.jsx":"f0e42041980a","ui_kits/hypera-site/Hero.jsx":"28c028994bf8","ui_kits/hypera-site/Highlights.jsx":"cac38ee7252e","ui_kits/hypera-site/NewsSection.jsx":"6f2da4dfd2c1"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.HyperaPharmaDesignSystem_e2c335 = window.HyperaPharmaDesignSystem_e2c335 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/buttons/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Hypera Pharma primary button family.
 * Variants: primary (solid blue), secondary (outline), ghost, dark.
 * Sizes: sm, md, lg. Optional leading/trailing Material Symbols icon.
 */
function Button({
  children,
  variant = "primary",
  size = "md",
  icon,
  iconTrailing,
  disabled = false,
  fullWidth = false,
  type = "button",
  onClick,
  style,
  ...rest
}) {
  const [hover, setHover] = React.useState(false);
  const [active, setActive] = React.useState(false);
  const sizes = {
    sm: {
      padding: "6px 16px",
      fontSize: "14px",
      icon: "18px"
    },
    md: {
      padding: "8px 24px",
      fontSize: "16px",
      icon: "20px"
    },
    lg: {
      padding: "12px 32px",
      fontSize: "17px",
      icon: "22px"
    }
  };
  const s = sizes[size] || sizes.md;
  const palettes = {
    primary: {
      base: {
        background: "var(--hy-blue)",
        color: "#fff",
        border: "1px solid var(--hy-blue)"
      },
      hover: {
        background: "var(--hy-blue-hover)",
        borderColor: "var(--hy-blue-hover)"
      },
      active: {
        background: "var(--hy-blue-active)",
        borderColor: "var(--hy-blue-active)"
      }
    },
    secondary: {
      base: {
        background: "#fff",
        color: "var(--hy-blue)",
        border: "1px solid var(--hy-blue)"
      },
      hover: {
        background: "var(--hy-blue-bg)"
      },
      active: {
        background: "#dcecf8"
      }
    },
    ghost: {
      base: {
        background: "transparent",
        color: "var(--hy-blue)",
        border: "1px solid transparent"
      },
      hover: {
        background: "var(--hy-blue-bg)"
      },
      active: {
        background: "#dcecf8"
      }
    },
    dark: {
      base: {
        background: "var(--hy-blue-dark)",
        color: "#fff",
        border: "1px solid var(--hy-blue-dark)"
      },
      hover: {
        background: "#053a61",
        borderColor: "#053a61"
      },
      active: {
        background: "#042d4c",
        borderColor: "#042d4c"
      }
    }
  };
  const p = palettes[variant] || palettes.primary;
  const composed = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    width: fullWidth ? "100%" : "auto",
    fontFamily: "var(--font-sans)",
    fontWeight: 400,
    fontSize: s.fontSize,
    lineHeight: 1.2,
    padding: s.padding,
    borderRadius: "var(--radius)",
    cursor: disabled ? "not-allowed" : "pointer",
    textDecoration: "none",
    transition: "background .18s ease, border-color .18s ease, box-shadow .18s ease, transform .05s ease",
    transform: active && !disabled ? "translateY(1px)" : "none",
    opacity: disabled ? 0.5 : 1,
    ...p.base,
    ...(hover && !disabled ? p.hover : null),
    ...(active && !disabled ? p.active : null),
    ...style
  };
  return /*#__PURE__*/React.createElement("button", _extends({
    type: type,
    disabled: disabled,
    onClick: onClick,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => {
      setHover(false);
      setActive(false);
    },
    onMouseDown: () => setActive(true),
    onMouseUp: () => setActive(false),
    style: composed
  }, rest), icon && /*#__PURE__*/React.createElement("span", {
    className: "material-symbols-outlined",
    style: {
      fontSize: s.icon
    }
  }, icon), children, iconTrailing && /*#__PURE__*/React.createElement("span", {
    className: "material-symbols-outlined",
    style: {
      fontSize: s.icon
    }
  }, iconTrailing));
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/buttons/Button.jsx", error: String((e && e.message) || e) }); }

// components/buttons/IconButton.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Circular / pill icon button — used for carousel navigation and toolbar actions.
 * Renders a single Material Symbols icon.
 */
function IconButton({
  icon = "chevron_right",
  variant = "primary",
  size = "md",
  disabled = false,
  ariaLabel,
  onClick,
  style,
  ...rest
}) {
  const [hover, setHover] = React.useState(false);
  const dims = {
    sm: 36,
    md: 44,
    lg: 52
  };
  const d = dims[size] || dims.md;
  const palettes = {
    primary: {
      base: {
        background: "var(--hy-blue)",
        color: "#fff",
        border: "1px solid var(--hy-blue)"
      },
      hover: {
        background: "var(--hy-blue-hover)",
        borderColor: "var(--hy-blue-hover)"
      }
    },
    outline: {
      base: {
        background: "#fff",
        color: "var(--hy-blue)",
        border: "1px solid var(--hy-blue)"
      },
      hover: {
        background: "var(--hy-blue-bg)"
      }
    },
    soft: {
      base: {
        background: "var(--hy-blue-bg)",
        color: "var(--hy-blue)",
        border: "1px solid transparent"
      },
      hover: {
        background: "#dcecf8"
      }
    }
  };
  const p = palettes[variant] || palettes.primary;
  return /*#__PURE__*/React.createElement("button", _extends({
    type: "button",
    "aria-label": ariaLabel || icon,
    disabled: disabled,
    onClick: onClick,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      width: d,
      height: d,
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      borderRadius: "var(--radius-pill)",
      cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? 0.5 : 1,
      transition: "background .18s ease, border-color .18s ease",
      ...p.base,
      ...(hover && !disabled ? p.hover : null),
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("span", {
    className: "material-symbols-outlined",
    style: {
      fontSize: d * 0.5
    }
  }, icon));
}
Object.assign(__ds_scope, { IconButton });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/buttons/IconButton.jsx", error: String((e && e.message) || e) }); }

// components/data-display/Badge.jsx
try { (() => {
/** Small status / category badge. */
function Badge({
  children,
  variant = "primary",
  icon,
  style
}) {
  const palettes = {
    primary: {
      background: "var(--hy-blue)",
      color: "#fff"
    },
    soft: {
      background: "var(--hy-blue-bg)",
      color: "var(--hy-blue)"
    },
    cyan: {
      background: "var(--hy-cyan)",
      color: "#063b46"
    },
    light: {
      background: "var(--hy-blue-light)",
      color: "var(--hy-blue-dark)"
    },
    success: {
      background: "#e3f4ec",
      color: "var(--color-success)"
    },
    warning: {
      background: "#fbf0dd",
      color: "#9a6a18"
    },
    neutral: {
      background: "#eef0f1",
      color: "var(--hy-muted)"
    }
  };
  const p = palettes[variant] || palettes.primary;
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: "4px",
      fontFamily: "var(--font-sans)",
      fontSize: "12px",
      fontWeight: 600,
      lineHeight: 1,
      padding: "5px 10px",
      borderRadius: "var(--radius-pill)",
      ...p,
      ...style
    }
  }, icon && /*#__PURE__*/React.createElement("span", {
    className: "material-symbols-outlined",
    style: {
      fontSize: 14
    }
  }, icon), children);
}
Object.assign(__ds_scope, { Badge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data-display/Badge.jsx", error: String((e && e.message) || e) }); }

// components/data-display/Card.jsx
try { (() => {
/**
 * Versatile content card — product, news, brand. Soft shadow, 8–18px radius.
 * Optional image header, eyebrow, title, body, and footer slot.
 */
function Card({
  image,
  imageAlt = "",
  imageHeight = 180,
  imageFit = "cover",
  eyebrow,
  title,
  children,
  footer,
  radius = "var(--radius)",
  interactive = false,
  padding = "20px",
  onClick,
  style
}) {
  const [hover, setHover] = React.useState(false);
  return /*#__PURE__*/React.createElement("div", {
    onClick: onClick,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      display: "flex",
      flexDirection: "column",
      background: "var(--surface-card)",
      border: "1px solid var(--hy-border)",
      borderRadius: radius,
      overflow: "hidden",
      fontFamily: "var(--font-sans)",
      boxShadow: hover && interactive ? "var(--shadow-md)" : "var(--shadow-sm)",
      transform: hover && interactive ? "translateY(-3px)" : "none",
      transition: "box-shadow .2s ease, transform .2s ease",
      cursor: interactive ? "pointer" : "default",
      ...style
    }
  }, image && /*#__PURE__*/React.createElement("div", {
    style: {
      height: imageHeight,
      background: "var(--hy-blue-bg)",
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: image,
    alt: imageAlt,
    style: {
      width: "100%",
      height: "100%",
      objectFit: imageFit,
      display: "block"
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      padding,
      display: "flex",
      flexDirection: "column",
      gap: "8px",
      flex: 1
    }
  }, eyebrow && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: "12px",
      fontWeight: 600,
      letterSpacing: "0.04em",
      textTransform: "uppercase",
      color: "var(--hy-cyan)"
    }
  }, eyebrow), title && /*#__PURE__*/React.createElement("h3", {
    style: {
      margin: 0,
      fontSize: "18px",
      fontWeight: 700,
      lineHeight: 1.3,
      color: "var(--hy-ink)"
    }
  }, title), children && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: "15px",
      lineHeight: 1.5,
      color: "var(--hy-body)"
    }
  }, children), footer && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: "auto",
      paddingTop: "8px"
    }
  }, footer)));
}
Object.assign(__ds_scope, { Card });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data-display/Card.jsx", error: String((e && e.message) || e) }); }

// components/data-display/Tag.jsx
try { (() => {
/** Filter / category chip. Optional removable & selectable. */
function Tag({
  children,
  selected = false,
  removable = false,
  onRemove,
  onClick,
  style
}) {
  const [hover, setHover] = React.useState(false);
  return /*#__PURE__*/React.createElement("span", {
    onClick: onClick,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: "6px",
      fontFamily: "var(--font-sans)",
      fontSize: "14px",
      fontWeight: 500,
      padding: "6px 12px",
      borderRadius: "var(--radius-pill)",
      cursor: onClick ? "pointer" : "default",
      background: selected ? "var(--hy-blue)" : hover && onClick ? "var(--hy-blue-bg)" : "#fff",
      color: selected ? "#fff" : "var(--hy-blue)",
      border: `1px solid ${selected ? "var(--hy-blue)" : "var(--border-strong)"}`,
      transition: "background .15s ease, color .15s ease",
      ...style
    }
  }, children, removable && /*#__PURE__*/React.createElement("span", {
    className: "material-symbols-outlined",
    onClick: e => {
      e.stopPropagation();
      onRemove && onRemove();
    },
    style: {
      fontSize: 16,
      cursor: "pointer"
    }
  }, "close"));
}
Object.assign(__ds_scope, { Tag });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data-display/Tag.jsx", error: String((e && e.message) || e) }); }

// components/forms/Checkbox.jsx
try { (() => {
/** Checkbox with label. Controlled or uncontrolled. */
function Checkbox({
  label,
  checked,
  defaultChecked,
  disabled = false,
  onChange,
  id,
  style
}) {
  const cbId = id || React.useId();
  const [internal, setInternal] = React.useState(!!defaultChecked);
  const isChecked = checked !== undefined ? checked : internal;
  const toggle = e => {
    if (disabled) return;
    if (checked === undefined) setInternal(e.target.checked);
    onChange && onChange(e);
  };
  return /*#__PURE__*/React.createElement("label", {
    htmlFor: cbId,
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: "10px",
      fontFamily: "var(--font-sans)",
      fontSize: "16px",
      color: "var(--hy-body)",
      cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? 0.5 : 1,
      ...style
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 20,
      height: 20,
      borderRadius: "4px",
      flexShrink: 0,
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      background: isChecked ? "var(--hy-blue)" : "#fff",
      border: `1px solid ${isChecked ? "var(--hy-blue)" : "var(--border-strong)"}`,
      transition: "background .15s ease, border-color .15s ease"
    }
  }, isChecked && /*#__PURE__*/React.createElement("span", {
    className: "material-symbols-outlined",
    style: {
      fontSize: 16,
      color: "#fff"
    }
  }, "check")), /*#__PURE__*/React.createElement("input", {
    id: cbId,
    type: "checkbox",
    checked: isChecked,
    disabled: disabled,
    onChange: toggle,
    style: {
      position: "absolute",
      opacity: 0,
      width: 0,
      height: 0
    }
  }), label);
}
Object.assign(__ds_scope, { Checkbox });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Checkbox.jsx", error: String((e && e.message) || e) }); }

// components/forms/Input.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Text input with optional label, leading icon, helper / error text.
 */
function Input({
  label,
  placeholder,
  value,
  defaultValue,
  type = "text",
  icon,
  helper,
  error,
  disabled = false,
  required = false,
  id,
  onChange,
  style,
  ...rest
}) {
  const [focus, setFocus] = React.useState(false);
  const inputId = id || React.useId();
  const borderColor = error ? "var(--color-danger)" : focus ? "var(--hy-blue)" : "var(--border-strong)";
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: "6px",
      fontFamily: "var(--font-sans)",
      ...style
    }
  }, label && /*#__PURE__*/React.createElement("label", {
    htmlFor: inputId,
    style: {
      fontSize: "14px",
      fontWeight: 500,
      color: "var(--hy-ink)"
    }
  }, label, required && /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--color-danger)"
    }
  }, " *")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: "8px",
      background: disabled ? "#f4f5f6" : "#fff",
      border: `1px solid ${borderColor}`,
      borderRadius: "var(--radius)",
      padding: "0 14px",
      boxShadow: focus && !error ? "var(--shadow-focus)" : "none",
      transition: "border-color .15s ease, box-shadow .15s ease"
    }
  }, icon && /*#__PURE__*/React.createElement("span", {
    className: "material-symbols-outlined",
    style: {
      fontSize: "20px",
      color: "var(--hy-muted)"
    }
  }, icon), /*#__PURE__*/React.createElement("input", _extends({
    id: inputId,
    type: type,
    placeholder: placeholder,
    value: value,
    defaultValue: defaultValue,
    disabled: disabled,
    required: required,
    onChange: onChange,
    onFocus: () => setFocus(true),
    onBlur: () => setFocus(false),
    style: {
      flex: 1,
      border: "none",
      outline: "none",
      background: "transparent",
      fontFamily: "var(--font-sans)",
      fontSize: "16px",
      color: "var(--hy-body)",
      padding: "11px 0"
    }
  }, rest))), (helper || error) && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: "12px",
      color: error ? "var(--color-danger)" : "var(--hy-muted)"
    }
  }, error || helper));
}
Object.assign(__ds_scope, { Input });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Input.jsx", error: String((e && e.message) || e) }); }

// components/forms/Select.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** Native select styled to match the Hypera form system. */
function Select({
  label,
  options = [],
  value,
  defaultValue,
  disabled = false,
  id,
  onChange,
  style,
  ...rest
}) {
  const [focus, setFocus] = React.useState(false);
  const selId = id || React.useId();
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: "6px",
      fontFamily: "var(--font-sans)",
      ...style
    }
  }, label && /*#__PURE__*/React.createElement("label", {
    htmlFor: selId,
    style: {
      fontSize: "14px",
      fontWeight: 500,
      color: "var(--hy-ink)"
    }
  }, label), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative"
    }
  }, /*#__PURE__*/React.createElement("select", _extends({
    id: selId,
    value: value,
    defaultValue: defaultValue,
    disabled: disabled,
    onChange: onChange,
    onFocus: () => setFocus(true),
    onBlur: () => setFocus(false),
    style: {
      appearance: "none",
      width: "100%",
      fontFamily: "var(--font-sans)",
      fontSize: "16px",
      color: "var(--hy-body)",
      background: disabled ? "#f4f5f6" : "#fff",
      border: `1px solid ${focus ? "var(--hy-blue)" : "var(--border-strong)"}`,
      borderRadius: "var(--radius)",
      padding: "11px 40px 11px 14px",
      outline: "none",
      boxShadow: focus ? "var(--shadow-focus)" : "none",
      cursor: disabled ? "not-allowed" : "pointer"
    }
  }, rest), options.map(o => {
    const val = typeof o === "string" ? o : o.value;
    const lbl = typeof o === "string" ? o : o.label;
    return /*#__PURE__*/React.createElement("option", {
      key: val,
      value: val
    }, lbl);
  })), /*#__PURE__*/React.createElement("span", {
    className: "material-symbols-outlined",
    style: {
      position: "absolute",
      right: 10,
      top: "50%",
      transform: "translateY(-50%)",
      pointerEvents: "none",
      color: "var(--hy-muted)"
    }
  }, "expand_more")));
}
Object.assign(__ds_scope, { Select });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Select.jsx", error: String((e && e.message) || e) }); }

// components/forms/Switch.jsx
try { (() => {
/** Toggle switch. */
function Switch({
  label,
  checked,
  defaultChecked,
  disabled = false,
  onChange,
  style
}) {
  const [internal, setInternal] = React.useState(!!defaultChecked);
  const on = checked !== undefined ? checked : internal;
  const toggle = () => {
    if (disabled) return;
    if (checked === undefined) setInternal(!on);
    onChange && onChange(!on);
  };
  return /*#__PURE__*/React.createElement("label", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: "10px",
      fontFamily: "var(--font-sans)",
      fontSize: "16px",
      color: "var(--hy-body)",
      cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? 0.5 : 1,
      ...style
    }
  }, /*#__PURE__*/React.createElement("span", {
    onClick: toggle,
    style: {
      width: 44,
      height: 24,
      borderRadius: "var(--radius-pill)",
      flexShrink: 0,
      position: "relative",
      background: on ? "var(--hy-blue)" : "#cfd5da",
      transition: "background .2s ease"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      position: "absolute",
      top: 2,
      left: on ? 22 : 2,
      width: 20,
      height: 20,
      borderRadius: "50%",
      background: "#fff",
      boxShadow: "0 1px 2px rgba(0,0,0,.2)",
      transition: "left .2s ease"
    }
  })), label);
}
Object.assign(__ds_scope, { Switch });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Switch.jsx", error: String((e && e.message) || e) }); }

// components/layout/Footer.jsx
try { (() => {
/** Hypera Pharma dark-blue footer with link columns and brand. */
function Footer({
  logo = "assets/logo-hypera-branco.svg",
  columns = [{
    title: "A Empresa",
    links: ["A Hypera Pharma", "Governança", "Sustentabilidade", "Carreiras"]
  }, {
    title: "Negócios",
    links: ["Nossos produtos", "Marcas", "Inovação", "Loja Hypera"]
  }, {
    title: "Investidores",
    links: ["Central de resultados", "Comunicados", "Governança corporativa"]
  }],
  note = "© 2026 Hypera Pharma. Todos os direitos reservados.",
  style
}) {
  return /*#__PURE__*/React.createElement("footer", {
    style: {
      background: "var(--hy-blue-dark)",
      color: "#fff",
      fontFamily: "var(--font-sans)",
      padding: "56px 40px 28px",
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 1200,
      margin: "0 auto",
      display: "flex",
      flexWrap: "wrap",
      gap: "48px",
      justifyContent: "space-between"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 280,
      display: "flex",
      flexDirection: "column",
      gap: "16px"
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: logo,
    alt: "Hypera Pharma",
    style: {
      height: 40,
      width: "auto",
      alignSelf: "flex-start",
      borderRadius: 6
    }
  }), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontSize: "14px",
      lineHeight: 1.6,
      color: "rgba(255,255,255,.75)"
    }
  }, "Uma das maiores farmac\xEAuticas do Brasil, dedicada a cuidar da sa\xFAde e do bem-estar das pessoas.")), columns.map(col => /*#__PURE__*/React.createElement("div", {
    key: col.title,
    style: {
      display: "flex",
      flexDirection: "column",
      gap: "12px"
    }
  }, /*#__PURE__*/React.createElement("h4", {
    style: {
      margin: 0,
      fontSize: "15px",
      fontWeight: 700,
      color: "var(--hy-cyan)"
    }
  }, col.title), col.links.map(l => /*#__PURE__*/React.createElement("a", {
    key: l,
    href: "#",
    style: {
      fontSize: "14px",
      color: "rgba(255,255,255,.82)",
      textDecoration: "none"
    }
  }, l))))), /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 1200,
      margin: "32px auto 0",
      paddingTop: "20px",
      borderTop: "1px solid rgba(255,255,255,.15)",
      fontSize: "13px",
      color: "rgba(255,255,255,.6)"
    }
  }, note));
}
Object.assign(__ds_scope, { Footer });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/layout/Footer.jsx", error: String((e && e.message) || e) }); }

// components/navigation/Link.jsx
try { (() => {
/** Inline text link in Hypera blue. No underline by default; underline + darken on hover. */
function Link({
  children,
  href = "#",
  external = false,
  icon,
  onClick,
  style
}) {
  const [hover, setHover] = React.useState(false);
  return /*#__PURE__*/React.createElement("a", {
    href: href,
    onClick: onClick,
    target: external ? "_blank" : undefined,
    rel: external ? "noopener noreferrer" : undefined,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: "4px",
      fontFamily: "var(--font-sans)",
      fontSize: "17px",
      fontWeight: 400,
      color: hover ? "var(--hy-blue-dark)" : "var(--hy-blue)",
      textDecoration: hover ? "underline" : "none",
      textUnderlineOffset: "3px",
      cursor: "pointer",
      transition: "color .15s ease",
      ...style
    }
  }, children, icon && /*#__PURE__*/React.createElement("span", {
    className: "material-symbols-outlined",
    style: {
      fontSize: 18
    }
  }, icon));
}
Object.assign(__ds_scope, { Link });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/Link.jsx", error: String((e && e.message) || e) }); }

// components/navigation/Navbar.jsx
try { (() => {
/**
 * Hypera Pharma site header. White bar, logo left, nav links, "Loja Hypera" cart CTA.
 */
function Navbar({
  logo = "assets/logo-hypera.svg",
  links = ["A Hypera Pharma", "Nossos produtos", "Carreiras", "Investidores", "Compliance"],
  active,
  cartLabel = "Loja Hypera",
  onCart,
  onNav,
  style
}) {
  const [hovered, setHovered] = React.useState(null);
  return /*#__PURE__*/React.createElement("header", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: "24px",
      padding: "14px 40px",
      background: "#fff",
      borderBottom: "1px solid var(--hy-border)",
      fontFamily: "var(--font-sans)",
      ...style
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: logo,
    alt: "Hypera Pharma",
    style: {
      height: 34,
      width: "auto"
    }
  }), /*#__PURE__*/React.createElement("nav", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: "28px",
      flex: 1,
      justifyContent: "center"
    }
  }, links.map((l, i) => {
    const isActive = active === l;
    const isHover = hovered === i;
    return /*#__PURE__*/React.createElement("a", {
      key: l,
      href: "#",
      onClick: e => {
        e.preventDefault();
        onNav && onNav(l);
      },
      onMouseEnter: () => setHovered(i),
      onMouseLeave: () => setHovered(null),
      style: {
        fontSize: "16px",
        fontWeight: isActive ? 600 : 400,
        color: isActive || isHover ? "var(--hy-blue)" : "var(--hy-ink)",
        textDecoration: "none",
        position: "relative",
        paddingBottom: "4px",
        borderBottom: isActive ? "2px solid var(--hy-cyan)" : "2px solid transparent",
        transition: "color .15s ease"
      }
    }, l);
  })), /*#__PURE__*/React.createElement("button", {
    onClick: onCart,
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: "8px",
      background: "var(--hy-blue)",
      color: "#fff",
      border: "none",
      borderRadius: "var(--radius)",
      padding: "9px 20px",
      cursor: "pointer",
      fontFamily: "var(--font-sans)",
      fontSize: "16px"
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "material-symbols-outlined",
    style: {
      fontSize: 20
    }
  }, "shopping_cart"), cartLabel));
}
Object.assign(__ds_scope, { Navbar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/Navbar.jsx", error: String((e && e.message) || e) }); }

// ui_kits/hypera-site/BrandStrip.jsx
try { (() => {
// Brand strip — Hypera's portfolio of consumer health brands, shown as wordmark tiles.
const BRANDS = [{
  name: "Neosaldina",
  color: "#E4002B"
}, {
  name: "Buscopan",
  color: "#0067B1"
}, {
  name: "Engov",
  color: "#F08A00"
}, {
  name: "Benegrip",
  color: "#00843D"
}, {
  name: "Doril",
  color: "#0093D0"
}, {
  name: "Addera D3",
  color: "#7A2E8E"
}, {
  name: "Vitasay",
  color: "#E94E1B"
}, {
  name: "Tamarine",
  color: "#6A8A1F"
}];
function BrandStrip() {
  return /*#__PURE__*/React.createElement("section", {
    style: {
      background: "var(--hy-blue-bg)",
      padding: "56px 40px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 1200,
      margin: "0 auto"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "center",
      marginBottom: 32
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      margin: "0 0 8px",
      fontSize: 30,
      fontWeight: 700,
      color: "var(--hy-ink)"
    }
  }, "Marcas em que o Brasil confia"), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontSize: 17,
      color: "var(--hy-body)"
    }
  }, "Um portf\xF3lio que cuida de toda a fam\xEDlia.")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(4, 1fr)",
      gap: 16
    }
  }, BRANDS.map(b => /*#__PURE__*/React.createElement("div", {
    key: b.name,
    style: {
      background: "#fff",
      border: "1px solid var(--hy-border)",
      borderRadius: "var(--radius)",
      height: 96,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      boxShadow: "var(--shadow-xs)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 22,
      fontWeight: 700,
      color: b.color,
      letterSpacing: "-.01em"
    }
  }, b.name))))));
}
window.BrandStrip = BrandStrip;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/hypera-site/BrandStrip.jsx", error: String((e && e.message) || e) }); }

// ui_kits/hypera-site/Hero.jsx
try { (() => {
// Hypera Pharma homepage hero — airy, white, blue. Uses Button from the DS.
const {
  Button
} = window.HyperaPharmaDesignSystem_e2c335;
function Hero() {
  return /*#__PURE__*/React.createElement("section", {
    style: {
      display: "grid",
      gridTemplateColumns: "1.05fr 1fr",
      alignItems: "center",
      gap: 48,
      maxWidth: 1200,
      margin: "0 auto",
      padding: "72px 40px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 20
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 14,
      fontWeight: 600,
      letterSpacing: ".06em",
      textTransform: "uppercase",
      color: "var(--hy-cyan)"
    }
  }, "Sa\xFAde e bem-estar"), /*#__PURE__*/React.createElement("h1", {
    style: {
      margin: 0,
      fontSize: 44,
      lineHeight: 1.12,
      fontWeight: 700,
      color: "var(--hy-ink)",
      textWrap: "balance"
    }
  }, "Cuidar da sa\xFAde das pessoas \xE9 o que nos move"), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontSize: 18,
      lineHeight: 1.5,
      color: "var(--hy-body)",
      maxWidth: 480
    }
  }, "Somos uma das maiores farmac\xEAuticas do Brasil, com marcas l\xEDderes que fazem parte do dia a dia de milh\xF5es de fam\xEDlias."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 12,
      marginTop: 8
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    iconTrailing: "arrow_forward"
  }, "Conhe\xE7a a Hypera"), /*#__PURE__*/React.createElement(Button, {
    variant: "secondary"
  }, "Nossos produtos"))), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      height: 380,
      borderRadius: "var(--radius-xl)",
      overflow: "hidden",
      boxShadow: "var(--shadow-lg)"
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: "../../assets/cover-light.jpg",
    alt: "",
    style: {
      width: "100%",
      height: "100%",
      objectFit: "cover"
    }
  })));
}
window.Hero = Hero;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/hypera-site/Hero.jsx", error: String((e && e.message) || e) }); }

// ui_kits/hypera-site/Highlights.jsx
try { (() => {
// Pillars / highlights section with feature cards using DS Card.
const {
  Card,
  Button: HButton
} = window.HyperaPharmaDesignSystem_e2c335;
const PILLARS = [{
  icon: "medication",
  eyebrow: "Portfólio",
  title: "Mais de 60 marcas",
  body: "Analgésicos, vitaminas, gripe & resfriado e cuidados diários para o Brasil inteiro."
}, {
  icon: "science",
  eyebrow: "Inovação",
  title: "Centro de P&D",
  body: "Pesquisa e desenvolvimento que transforma ciência em produtos acessíveis."
}, {
  icon: "verified",
  eyebrow: "Qualidade",
  title: "Padrão farmacêutico",
  body: "Rigor regulatório e segurança em cada etapa da produção."
}];
function Highlights() {
  return /*#__PURE__*/React.createElement("section", {
    style: {
      maxWidth: 1200,
      margin: "0 auto",
      padding: "72px 40px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-end",
      marginBottom: 28,
      flexWrap: "wrap",
      gap: 16
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      margin: 0,
      fontSize: 30,
      fontWeight: 700,
      color: "var(--hy-ink)"
    }
  }, "Por que Hypera Pharma"), /*#__PURE__*/React.createElement(HButton, {
    variant: "ghost",
    iconTrailing: "arrow_forward"
  }, "Sobre a empresa")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(3, 1fr)",
      gap: 24
    }
  }, PILLARS.map(p => /*#__PURE__*/React.createElement(Card, {
    key: p.title,
    radius: "var(--radius-xl)",
    padding: "28px",
    interactive: true
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 14
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "material-symbols-outlined",
    style: {
      fontSize: 40,
      color: "var(--hy-blue)",
      background: "var(--hy-blue-bg)",
      width: 64,
      height: 64,
      borderRadius: "var(--radius)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }
  }, p.icon), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      fontWeight: 600,
      letterSpacing: ".04em",
      textTransform: "uppercase",
      color: "var(--hy-cyan)"
    }
  }, p.eyebrow), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 20,
      fontWeight: 700,
      color: "var(--hy-ink)",
      lineHeight: 1.3
    }
  }, p.title), /*#__PURE__*/React.createElement("span", null, p.body))))));
}
window.Highlights = Highlights;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/hypera-site/Highlights.jsx", error: String((e && e.message) || e) }); }

// ui_kits/hypera-site/NewsSection.jsx
try { (() => {
// News / press section using DS Card with image header + Badge.
const {
  Card: NewsCard,
  Badge,
  Button: NewsBtn
} = window.HyperaPharmaDesignSystem_e2c335;
const NEWS = [{
  img: "../../assets/cover-blue.jpg",
  tag: "Investidores",
  date: "12 jun 2026",
  title: "Hypera Pharma divulga resultados do 2º trimestre"
}, {
  img: "../../assets/cover-blue-textured.jpg",
  tag: "Inovação",
  date: "28 mai 2026",
  title: "Novo centro de P&D amplia capacidade de pesquisa"
}, {
  img: "../../assets/cover-light.jpg",
  tag: "Sustentabilidade",
  date: "10 mai 2026",
  title: "Metas ESG avançam com foco em acesso à saúde"
}];
function NewsSection() {
  return /*#__PURE__*/React.createElement("section", {
    style: {
      background: "var(--hy-blue-bg)",
      padding: "72px 40px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 1200,
      margin: "0 auto"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-end",
      marginBottom: 28,
      flexWrap: "wrap",
      gap: 16
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      margin: 0,
      fontSize: 30,
      fontWeight: 700,
      color: "var(--hy-ink)"
    }
  }, "\xDAltimas not\xEDcias"), /*#__PURE__*/React.createElement(NewsBtn, {
    variant: "secondary",
    iconTrailing: "arrow_forward"
  }, "Sala de imprensa")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(3, 1fr)",
      gap: 24
    }
  }, NEWS.map(n => /*#__PURE__*/React.createElement(NewsCard, {
    key: n.title,
    image: n.img,
    imageHeight: 160,
    interactive: true,
    footer: /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 13,
        color: "var(--hy-muted)"
      }
    }, n.date)
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 10
    }
  }, /*#__PURE__*/React.createElement(Badge, {
    variant: "soft"
  }, n.tag), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 18,
      fontWeight: 700,
      color: "var(--hy-ink)",
      lineHeight: 1.32
    }
  }, n.title)))))));
}
window.NewsSection = NewsSection;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/hypera-site/NewsSection.jsx", error: String((e && e.message) || e) }); }

__ds_ns.Button = __ds_scope.Button;

__ds_ns.IconButton = __ds_scope.IconButton;

__ds_ns.Badge = __ds_scope.Badge;

__ds_ns.Card = __ds_scope.Card;

__ds_ns.Tag = __ds_scope.Tag;

__ds_ns.Checkbox = __ds_scope.Checkbox;

__ds_ns.Input = __ds_scope.Input;

__ds_ns.Select = __ds_scope.Select;

__ds_ns.Switch = __ds_scope.Switch;

__ds_ns.Footer = __ds_scope.Footer;

__ds_ns.Link = __ds_scope.Link;

__ds_ns.Navbar = __ds_scope.Navbar;

})();
