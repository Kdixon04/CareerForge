# Career Forge RLS checks. Uses fictional accounts and the publishable key.
# Passwords are prompted at runtime and are not written to disk.

$ErrorActionPreference = 'Stop'
$supabaseUrl = Read-Host 'Supabase project URL (https://....supabase.co)'
$publishableKey = Read-Host 'Supabase publishable/anon key'

function Read-PasswordText([string]$label) {
  $secure = Read-Host $label -AsSecureString
  $ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
  try { return [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr) }
  finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr) }
}

function Sign-In([string]$email, [string]$password) {
  $headers = @{ apikey = $publishableKey; 'Content-Type' = 'application/json' }
  $body = @{ email = $email; password = $password } | ConvertTo-Json
  Invoke-RestMethod -Method Post -Uri "$supabaseUrl/auth/v1/token?grant_type=password" -Headers $headers -Body $body
}

function Data-Request([string]$accessToken, [string]$method, [string]$path, [object]$body = $null) {
  $headers = @{
    apikey = $publishableKey
    Authorization = "Bearer $accessToken"
    'Content-Type' = 'application/json'
    Prefer = 'return=representation'
  }
  $params = @{ Method = $method; Uri = "$supabaseUrl/rest/v1/$path"; Headers = $headers }
  if ($null -ne $body) { $params.Body = ($body | ConvertTo-Json -Depth 10) }
  try {
    return @{ Status = 200; Body = @(Invoke-RestMethod @params) }
  } catch {
    return @{ Status = [int]$_.Exception.Response.StatusCode; Body = $_.ErrorDetails.Message }
  }
}

function Rpc-Request([string]$accessToken, [string]$name, [object]$body) {
  $headers = @{
    apikey = $publishableKey
    Authorization = "Bearer $accessToken"
    'Content-Type' = 'application/json'
  }
  try {
    return @{
      Status = 200
      Body = @(Invoke-RestMethod -Method Post -Uri "$supabaseUrl/rest/v1/rpc/$name" -Headers $headers -Body ($body | ConvertTo-Json))
    }
  } catch {
    return @{ Status = [int]$_.Exception.Response.StatusCode; Body = $_.ErrorDetails.Message }
  }
}

Write-Host 'Signing in fictional test accounts...' -ForegroundColor Cyan
$studentA = Sign-In 'student.a@careerforge.test' (Read-PasswordText 'Password for student.a')
$studentB = Sign-In 'student.b@careerforge.test' (Read-PasswordText 'Password for student.b')
$studentC = Sign-In 'student.c@careerforge.test' (Read-PasswordText 'Password for student.c')
$employerA = Sign-In 'employer.a@careerforge.test' (Read-PasswordText 'Password for employer.a')
$employerB = Sign-In 'employer.b@careerforge.test' (Read-PasswordText 'Password for employer.b')

$studentAId = $studentA.user.id
$studentBId = $studentB.user.id

Write-Host 'Student A cross-read of Student B profile (expect HTTP 200 with []):' -ForegroundColor Yellow
$crossRead = Data-Request $studentA.access_token 'Get' "profiles?select=id&id=eq.$studentBId"
Write-Host "HTTP $($crossRead.Status) Body: $($crossRead.Body | ConvertTo-Json -Compress)"

Write-Host 'Student B cross-read of Student A profile (expect HTTP 200 with []):' -ForegroundColor Yellow
$reverseRead = Data-Request $studentB.access_token 'Get' "profiles?select=id&id=eq.$studentAId"
Write-Host "HTTP $($reverseRead.Status) Body: $($reverseRead.Body | ConvertTo-Json -Compress)"

Write-Host 'Student C role escalation attempt (expect HTTP 401/403):' -ForegroundColor Yellow
$escalation = Data-Request $studentC.access_token 'Post' 'user_roles' @{ user_id = $studentC.user.id; role = 'admin' }
Write-Host "HTTP $($escalation.Status) Body: $($escalation.Body | ConvertTo-Json -Compress)"

Write-Host 'Student A visible jobs (expect the published demo job, not drafts):' -ForegroundColor Yellow
$visibleJobs = Data-Request $studentA.access_token 'Get' 'jobs?select=id,title,status,company,employer_id&source=eq.employer&order=title'
Write-Host "HTTP $($visibleJobs.Status) Body: $($visibleJobs.Body | ConvertTo-Json -Compress)"
$publishedJob = @($visibleJobs.Body | Where-Object { $_.status -eq 'published' } | Select-Object -First 1)

Write-Host 'Employer A read of Employer B draft (expect HTTP 200 with []):' -ForegroundColor Yellow
$otherDraft = Data-Request $employerA.access_token 'Get' 'jobs?select=id,title,status&title=eq.Demo%20Product%20Design%20Internship'
Write-Host "HTTP $($otherDraft.Status) Body: $($otherDraft.Body | ConvertTo-Json -Compress)"

Write-Host 'Employer A aggregate stats (only Employer A listings should appear):' -ForegroundColor Yellow
$statsA = Rpc-Request $employerA.access_token 'get_employer_stats' @{}
Write-Host "HTTP $($statsA.Status) Body: $($statsA.Body | ConvertTo-Json -Compress)"

if ($publishedJob.Count -eq 1) {
  Write-Host 'Student A saves the published job, then retries the same save...' -ForegroundColor Yellow
  $saveBody = @{ user_id = $studentA.user.id; job_id = $publishedJob.id; status = 'saved' }
  $save1 = Data-Request $studentA.access_token 'Post' 'saved_applications' $saveBody
  $save2 = Data-Request $studentA.access_token 'Post' 'saved_applications' $saveBody
  Write-Host "First save: HTTP $($save1.Status) Body: $($save1.Body | ConvertTo-Json -Compress)"
  Write-Host "Retry save: HTTP $($save2.Status) Body: $($save2.Body | ConvertTo-Json -Compress)"
  $savedRows = Data-Request $studentA.access_token 'Get' "saved_applications?select=id,job_id&job_id=eq.$($publishedJob.id)"
  Write-Host "Saved rows after retry (expect one): HTTP $($savedRows.Status) Body: $($savedRows.Body | ConvertTo-Json -Compress)"
  $savedRow = @($savedRows.Body | Select-Object -First 1)
  if ($savedRow.Count -eq 1) {
    $unsave = Data-Request $studentA.access_token 'Delete' "saved_applications?id=eq.$($savedRow[0].id)"
    Write-Host "Unsave: HTTP $($unsave.Status) Body: $($unsave.Body | ConvertTo-Json -Compress)"
  }

  Write-Host 'Student A records the same published view twice...' -ForegroundColor Yellow
  $view1 = Rpc-Request $studentA.access_token 'record_job_view' @{ p_job_id = $publishedJob.id }
  $view2 = Rpc-Request $studentA.access_token 'record_job_view' @{ p_job_id = $publishedJob.id }
  Write-Host "First view: HTTP $($view1.Status); second view: HTTP $($view2.Status)"
  $statsB = Rpc-Request $employerB.access_token 'get_employer_stats' @{}
  Write-Host "Employer B stats after duplicate view: HTTP $($statsB.Status) Body: $($statsB.Body | ConvertTo-Json -Compress)"
} else {
  Write-Host 'No published job was returned; view test was not run.' -ForegroundColor Red
}

Write-Host 'Interpret results using supabase/SECURITY_CHECKS.md. HTTP 200 with [] is expected isolation.' -ForegroundColor Cyan
