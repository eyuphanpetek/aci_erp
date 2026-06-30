cd backend/ErpApi
sed -i 's/using Microsoft.OpenApi.Models;/using Microsoft.OpenApi.Models;\nusing System.Threading.RateLimiting;\nusing Microsoft.AspNetCore.RateLimiting;/g' Program.cs

sed -i '/var app = builder.Build();/i \
builder.Services.AddRateLimiter(options =>\n{\n    options.AddFixedWindowLimiter("LoginPolicy", opt =>\n    {\n        opt.Window = TimeSpan.FromMinutes(1);\n        opt.PermitLimit = 5;\n        opt.QueueLimit = 0;\n    });\n    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;\n});\n' Program.cs

sed -i '/app.UseCors("AllowAll");/a \
app.UseRateLimiter();' Program.cs

sed -i 's/\[AllowAnonymous\]/\[AllowAnonymous\]\n    \[EnableRateLimiting("LoginPolicy")\]/g' Controllers/AuthController.cs
sed -i 's/using Microsoft.AspNetCore.Authorization;/using Microsoft.AspNetCore.Authorization;\nusing Microsoft.AspNetCore.RateLimiting;/g' Controllers/AuthController.cs

dotnet build
