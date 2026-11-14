from pathlib import Path
import os,secrets,subprocess,json
os.chdir(Path(__file__).resolve().parents[1])
os.umask(0o077)
d=Path.home()/'Library/Application Support/Impact Aid/signing';d.mkdir(mode=0o700,parents=True,exist_ok=True)
k=d/'impact-aid-release.p12';pw=d/'keystore.password'
if not k.exists():
 if pw.exists():raise SystemExit('Incomplete keystore setup')
 pw.write_text(secrets.token_urlsafe(40))
 subprocess.run(['keytool','-genkeypair','-alias','impactaid','-keyalg','RSA','-keysize','3072','-validity','10000','-storetype','PKCS12','-keystore',str(k),'-storepass:file',str(pw),'-dname','CN=Impact Aid Android Release'],check=True)
rel=Path('release');rel.mkdir(exist_ok=True)
Path('.work').mkdir(mode=0o700,exist_ok=True)
version=json.loads(Path('package.json').read_text())['version']
p=rel/f'Impact-Aid-{version}.apk'
tools=Path.home()/'Library/Android/sdk/build-tools/36.0.0'
subprocess.run([str(tools/'zipalign'),'-f','-P','16','4','android/app/build/outputs/apk/release/app-release-unsigned.apk','.work/aligned.apk'],check=True)
subprocess.run([str(tools/'apksigner'),'sign','--ks',str(k),'--ks-key-alias','impactaid','--ks-pass','file:'+str(pw),'--out',str(p),'.work/aligned.apk'],check=True)
subprocess.run([str(tools/'apksigner'),'verify','--verbose',str(p)],check=True);p.chmod(0o644)
