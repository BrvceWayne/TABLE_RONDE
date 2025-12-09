module ApplicationHelper
  def qr_code_svg(url, size: 200)
    qrcode = RQRCode::QRCode.new(url)
    qrcode.as_svg(
      color: "016642",
      shape_rendering: "crispEdges",
      module_size: 4,
      standalone: true,
      use_path: true,
      viewbox: true,
      svg_attributes: {
        width: size,
        height: size,
        class: "qr-code"
      }
    ).html_safe
  end
end
