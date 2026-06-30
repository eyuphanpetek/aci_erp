cd backend/ErpApi
dotnet run > output.log 2>&1 &
sleep 5
for i in {1..7}; do
  curl -X POST http://localhost:5000/api/Auth/login -H "Content-Type: application/json" -d '{"email":"superadmin@erp.local","password":"wrongpassword"}' -w "%{http_code}\n" -s -o /dev/null
done
kill %1
