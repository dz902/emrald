from flask import Flask, request, Response

import os
import re
from inspect import getmembers, isfunction
import yaml
import rest
import requests
import utils
from checkers import properties_file_checker, xml_file_checker

app = Flask(__name__)

@app.route("/")
def hello_world():
    with open('rules/emr.yaml') as file:
      config = yaml.safe_load(file)

    conf_envs = config.get('envs', {})
    envs = {}
    for ek in conf_envs:
      conf_env = conf_envs[ek]
      conf_env_file = conf_env.get('file', None)
      env = utils.read_config_file(conf_env_file)

      formatted = conf_env.get('formatted', {})
      for fk in formatted:
        k, pattern = formatted[fk]
        result = re.search(pattern, env[k])
        env_formatted = result.group(1) if result else None
        env[fk] = env_formatted
      
      envs[ek] = env

    check_results = {}
    rule_sets = config.get('ruleSets', {})
    for rk in rule_sets:
      check_results[rk] = {}
      rule_set = rule_sets[rk]
      config = utils.read_config_file(rule_set['file'])

      rules = rule_set.get('rules', [])
      for rule in rules:
        if 'condition' in rule:
          if not eval(rule['condition'].format_map(envs)):
            check_results[rk][rule['params']['key']] = True, f'条件不满足：{rule["condition"]}'
            continue

        checker = getattr(properties_file_checker, rule['type'], None)
        if not checker:
          raise Exception(f'[ERROR] "{rule["type"]}" not in {dir(properties_file_checker)}')

        check_result = checker(config, **rule['params'])
        check_results[rk][rule['params']['key']] = check_result

    return check_results

@app.route('/yarn/<path:path>', methods=['GET', 'OPTIONS'])
def yarn(path):
    if request.method == 'GET':
      YARN_HOST = os.environ["YARN_HOST"]
      if request.method == 'GET':
          response = rest.get(f'{YARN_HOST}/{path}?{request.query_string.decode("ascii")}')

      return Response(response.data, 200, mimetype = 'application/json', headers = {
          'Access-Control-Allow-Origin': '*'
      })
    elif request.method == 'OPTIONS':
      return Response(None, 200, headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '300'
      })

@app.route('/yarn_timeline/<path:path>', methods=['GET', 'OPTIONS'])
def yarn_timeline(path):
    if request.method == 'GET':
      YARN_TIMELINE_HOST = os.environ["YARN_TIMELINE_HOST"]
      if request.method == 'GET':
        response = rest.get(f'{YARN_TIMELINE_HOST}/{path}?{request.query_string.decode("ascii")}')

      return Response(response.data, 200, mimetype = 'application/json', headers = {
        'Access-Control-Allow-Origin': '*'
      })
    elif request.method == 'OPTIONS':
      return Response(None, 200, headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '300'
      })