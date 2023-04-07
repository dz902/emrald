import os
import io
import paramiko
import jprops
import configobj
import json
import xml.etree.ElementTree as ET

def ssh_download_file(host, path):
  SSH_KEY = os.environ['SSH_KEY']

  ssh_key = paramiko.RSAKey.from_private_key_file(SSH_KEY)
  ssh_client = paramiko.SSHClient()
  ssh_client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
  ssh_client.connect(host, username='hadoop', pkey=ssh_key)

  with ssh_client.open_sftp() as sftp_client:
      with sftp_client.open(path) as remote_file:
          file_contents = remote_file.read(-1).decode('utf-8')
  
  return file_contents

def read_properties(contents):
  properties_file = io.StringIO()
  properties_file.write(contents)
  properties_file.seek(0, os.SEEK_SET)
  
  return jprops.load_properties(properties_file)

def read_json(contents):
  return json.loads(contents)

def read_ini(contents):
  config = configobj.ConfigObj(io.StringIO(contents))

  return config

def read_xml(contents):
  return ET.fromstring(contents)

def read_config_file(filename):
  SSH_HOST = os.environ['SSH_HOST']

  contents = ssh_download_file(SSH_HOST, filename)
  ext = get_ext(filename)

  if ext == 'properties':
    config = read_properties(contents)
  elif ext == 'json':
    config = read_json(contents)
  elif ext == 'ini':
    config = read_ini(contents)
  elif ext == 'xml':
    config = read_xml(contents)
  else:
    raise Exception(ext)
  
  return config

def get_ext(filename):
  return filename.split('.')[-1]