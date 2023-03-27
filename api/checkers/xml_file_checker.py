import re

def evalCheck(config, expr, msg):
  expr = re.sub('\{([^}]+)\}', 'config.find(\'./property[name="\1"]/value\').text')

  if eval(expr):
     return msg
  else:
     return True