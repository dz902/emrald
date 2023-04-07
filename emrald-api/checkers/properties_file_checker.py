import xml
import re

def valueEquals(properties, key, desiredValue, msg):
  if properties[key] != desiredValue:
      return msg
  else:
      return True

def evalCheck(config, key, expr, msg):
  if type(config) == xml.etree.ElementTree.Element:
    value = config.find(f'./property[name="{key}"]/value')
    if not value:
      return False, msg.format('不存在')
  else:
    if key not in config:
      return False, msg.format('不存在')
    value = config[key]

  if not eval(expr.format(value)):
    return False, msg.format(value)
  else:
    return True, None