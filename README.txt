# 1. Crea una conexión limpia 
#DEV
pac auth create --name spot --url https://org2edaf7ee.crm.dynamics.com/

# 2. Intenta el push de nuevo
pac pcf push --publisher-prefix spot
pac pcf push --publisher-prefix spot --verbosity minimal 



#TEST
pac auth create --name spottest --url https://accesoareasgaby.crm.dynamics.com/

# 2. Intenta el push de nuevo
pac pcf push --publisher-prefix spottest
pac pcf push --publisher-prefix spottest --verbosity minimal 


#detener procesos 
Stop-Process -Name "MSBuild", "dotnet", "pac", "PowerAppsTools*", "omnisharp" -Force -ErrorAction SilentlyContinue

npm run build

#para debug
npm start 

