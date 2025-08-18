param(
  [string]$ProjectName = "atestados-medicos-starter"
)

Write-Host "==> Bootstrap do projeto: $ProjectName" -ForegroundColor Cyan

# Verificações básicas
$tools = @("git", "node", "npm", "docker")
foreach ($t in $tools) {
  if (-not (Get-Command $t -ErrorAction SilentlyContinue)) {
    Write-Warning "$t não encontrado no PATH. Instale antes de continuar."
  } else {
    Write-Host "$t OK: $((Get-Command $t).Source)"
  }
}

# Criar .env se não existir
if (-not (Test-Path ".\.env")) {
  if (Test-Path ".\.env.example") {
    Copy-Item ".\.env.example" ".\.env"
    Write-Host "Arquivo .env criado a partir de .env.example. **Edite as credenciais da OMS antes do deploy.**" -ForegroundColor Yellow
    # gerar um JWT_SECRET simples
    $rand = -join ((48..57 + 65..90 + 97..122) | Get-Random -Count 48 | % {[char]$_})
    (Get-Content ".\.env") -replace "JWT_SECRET=replace_me_with_a_long_random_string", "JWT_SECRET=$rand" | Set-Content ".\.env"
  }
}

# Git init
if (-not (Test-Path ".\.git")) {
  git init
  git add .
  git commit -m "chore: initial scaffold"
  Write-Host "Repositório git inicializado."
}

# Build & up
Write-Host "Construindo imagens e subindo containers com Docker Compose..." -ForegroundColor Cyan
docker compose up -d --build

Write-Host "Pronto!"
Write-Host "API   -> http://localhost:3000/health"
Write-Host "Web   -> http://localhost:5173"
