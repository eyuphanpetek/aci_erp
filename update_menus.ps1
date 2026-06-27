$files = @(
    "c:\Users\ippae\Desktop\erp\frontend\html\vertical-menu-template\index.html",
    "c:\Users\ippae\Desktop\erp\frontend\html\vertical-menu-template\app-user-list.html",
    "c:\Users\ippae\Desktop\erp\frontend\html\vertical-menu-template\app-access-roles.html",
    "c:\Users\ippae\Desktop\erp\frontend\html\vertical-menu-template\app-access-permission.html"
)

$newMenu = @"
        <ul class="menu-inner py-1">
          <!-- Dashboards -->
          <li class="menu-item active">
            <a href="index.html" class="menu-link">
              <i class="menu-icon icon-base ti tabler-smart-home"></i>
              <div data-i18n="Dashboards">Ana Sayfa</div>
            </a>
          </li>

          <!-- Yönetim -->
          <li class="menu-header small">
            <span class="menu-header-text" data-i18n="Management">YÖNETİM</span>
          </li>
          <li class="menu-item">
            <a href="javascript:void(0);" class="menu-link menu-toggle">
              <i class="menu-icon icon-base ti tabler-users"></i>
              <div data-i18n="User Management">Kullanıcı Yönetimi</div>
            </a>
            <ul class="menu-sub">
              <li class="menu-item">
                <a href="app-user-list.html" class="menu-link">
                  <div data-i18n="User List">Kullanıcı Listesi</div>
                </a>
              </li>
              <li class="menu-item">
                <a href="app-access-roles.html" class="menu-link">
                  <div data-i18n="Roles">Roller</div>
                </a>
              </li>
            </ul>
          </li>

          <!-- Yayıncılık -->
          <li class="menu-header small">
            <span class="menu-header-text" data-i18n="Publishing Section">YAYINCILIK</span>
          </li>
          <li class="menu-item">
            <a href="javascript:void(0);" class="menu-link menu-toggle">
              <i class="menu-icon icon-base ti tabler-book-2"></i>
              <div data-i18n="Publishing">Yayıncılık</div>
            </a>
            <ul class="menu-sub">
              <li class="menu-item">
                <a href="pub-dashboard.html" class="menu-link">
                  <div data-i18n="Cost & Tracking">Maliyet & İş Takibi</div>
                </a>
              </li>
              <li class="menu-item">
                <a href="pub-product-management.html" class="menu-link">
                  <div data-i18n="Product Management">Ürün Yönetimi</div>
                </a>
              </li>
              <li class="menu-item">
                <a href="pub-price-tariff.html" class="menu-link">
                  <div data-i18n="Price Tariff">Fiyat Tarifesi</div>
                </a>
              </li>
              <li class="menu-item">
                <a href="pub-author-search.html" class="menu-link">
                  <div data-i18n="Author Search">Yazar Ara</div>
                </a>
              </li>
            </ul>
          </li>
        </ul>
"@

foreach ($file in $files) {
    if (Test-Path $file) {
        $content = [System.IO.File]::ReadAllText($file)
        
        # We need to replace from <ul class="menu-inner py-1"> to the last </ul> before </aside>
        # Using a regex that captures everything between them.
        # (?s) makes the dot match newlines.
        $pattern = '(?s)<ul class="menu-inner py-1">.*?</ul>\s*(?=</aside>)'
        
        $newContent = [System.Text.RegularExpressions.Regex]::Replace($content, $pattern, $newMenu + "`n        ")
        
        # Cache bust main.js
        $newContent = $newContent.Replace("main.js?v=1.0.1", "main.js?v=1.0.2")
        
        [System.IO.File]::WriteAllText($file, $newContent)
        Write-Host "Updated $file"
    } else {
        Write-Host "File not found: $file"
    }
}
